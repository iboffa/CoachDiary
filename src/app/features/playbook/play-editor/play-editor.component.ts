import {
  Component, ElementRef, OnDestroy,
  afterNextRender, computed, inject, signal, viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TitleCasePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Canvas, Circle, Group, FabricText, Path, FabricObject,
} from 'fabric';
import {
  COURT_OUT_OF_BOUNDS_PADDING,
  drawCourt,
  courtCanvasSize,
  courtSize,
  CourtMode,
} from './court-painter';
import { PlayService } from '../../../core/services/play.service';
import { Play } from '../../../shared/models/models';
import {
  BALL_INDICATOR_RADIUS,
  FIVE_OUT,
  PATH_STYLES,
  TOKEN_RADIUS,
} from './play-editor.constants';
import {
  ActionType,
  AnimState,
  ContextMenuState,
  PathEditState,
  Phase,
  PhasePath,
  PlayerToken,
  Point,
  ScheduledPath,
  ShadowToken,
  StoredPath,
  Tool,
} from './play-editor.models';
import {
  buildPhasePathSchedule as createPhasePathSchedule,
  getBallIndicatorState as resolveBallIndicatorState,
  getCarrierBallIndicatorState as resolveCarrierBallIndicatorState,
  getPlayerPositionAtTime as resolvePlayerPositionAtTime,
  getRemainingPathPoints as resolveRemainingPathPoints,
  getScheduledPathCoverage as resolveScheduledPathCoverage,
  isMovementAction as isMovementPathAction,
} from './play-editor-path.utils';
import { renderActionPathObjects } from './play-editor-fabric.utils';
import {
  ensureEditableMovementPoints,
  findPlayerToken,
  getCurrentAnchorPosition,
  isEditableMovementPath,
} from './play-editor-editing.utils';
import {
  buildPlayEditorStateSnapshot,
  buildPlaySavePayload,
  parsePlayEditorCanvasState,
  toDownloadFilename,
} from './play-editor-persistence.utils';
import {
  advanceTokensToPathEndpoints,
  captureTokenPositions,
  restoreSavedTokenPositions,
  syncTokensToPhasePositions,
  syncTokensToResolvedPositions,
  syncTokensToStoredPositions,
} from './play-editor-token-position.utils';
import { bindPlayEditorCanvasEvents } from './play-editor-canvas-events.utils';
import {
  appendDrawPoint,
  buildDrawnMovementStoredPath,
  buildPassStoredPath,
  buildShootStoredPath,
} from './play-editor-action-path.utils';
import { exportPlayEditorPdf, exportPlayEditorVideo } from './play-editor-export.utils';
import {
  applyActivePathControlEdit as applyFabricActivePathControlEdit,
  applyShadowEndpointEdit as applyFabricShadowEndpointEdit,
  clearShadowTokens as clearFabricShadowTokens,
  createPathControlHandle as createFabricPathControlHandle,
  erasePlayEditorObject,
  rebuildEditablePath as rebuildFabricEditablePath,
  refreshShadowTokens as refreshFabricShadowTokens,
  removeTaggedPathHandles as removeFabricTaggedPathHandles,
  syncDraggedShadowPlaceholder as syncFabricDraggedShadowPlaceholder,
} from './play-editor-fabric-editing.utils';

@Component({
  selector: 'app-play-editor',
  imports: [FormsModule, TitleCasePipe],
  templateUrl: './play-editor.component.html',
  styleUrl: './play-editor.component.scss',
  host: {
    '(document:keydown.escape)': 'onEscape()',
    '(document:pointerdown)': 'onDocumentPointerDown($event)',
  },
})
export class PlayEditorComponent implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly playService = inject(PlayService);
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('courtCanvas');
  private fabricCanvas!: Canvas;

  // ── Reactive signals ──────────────────────────────────────────
  readonly playId    = signal<number | null>(null);
  readonly playName  = signal('New Play');
  readonly playDesc  = signal('');
  readonly playCat   = signal<Play['category']>('offense');
  readonly courtMode = signal<CourtMode>('half');

  readonly activeTool    = signal<Tool>('select');
  readonly animState     = signal<AnimState>('idle');
  readonly animSpeed     = signal(1);
  readonly animProgress  = signal(0);
  readonly showAnimatedLines = signal(true);
  readonly saving        = signal(false);

  readonly ballCarrierId     = signal<string | null>(null);
  readonly contextMenu       = signal<ContextMenuState | null>(null);
  readonly pendingAction     = signal<ActionType | null>(null);
  readonly currentPathCount  = signal(0);
  readonly phaseCount        = signal(0);
  readonly currentPhaseIndex = signal(0);
  readonly pendingPassFrom   = signal<string | null>(null);

  readonly isPlaying   = computed(() => this.animState() === 'playing');
  readonly canPreview  = computed(() => this.phaseCount() > 0);

  readonly categories: Play['category'][] = ['offense', 'defense', 'transition', 'inbound', 'press-break'];

  // ── Internal canvas state ─────────────────────────────────────
  private tokens: PlayerToken[] = [];
  private shadowTokens: ShadowToken[] = [];
  private currentPhasePaths: PhasePath[] = [];
  private _phases: Phase[] = [];
  private defenseCount = 0;
  private isDrawing = false;
  private currentPathPoints: Point[] = [];
  private livePathObj: Path | null = null;
  private pendingDrawStart: Point | null = null;
  private activeOwnerId: string | null = null;
  private activePathEdit: PathEditState | null = null;
  private mouseDownPoint: Point | null = null;
  private animFrameId: number | null = null;
  private ballIndicator: Circle | null = null;
  private animatedPhaseObjects: FabricObject[] = [];
  private readonly ANIM_DURATION = 2500;
  private activeAnimResolve: (() => void) | null = null;

  get phases(): Phase[] { return this._phases; }

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') this.playId.set(parseInt(id, 10));

    afterNextRender(() => {
      this.initCanvas();
      if (this.playId()) this.loadPlay();
      else this.placeDefaultPlayers();
    });
  }

  ngOnDestroy(): void {
    this.stopAnimation();
    this.fabricCanvas?.dispose();
  }

  onEscape(): void {
    if (this.pendingAction()) this.setTool('select');
    this.contextMenu.set(null);
    this.pendingAction.set(null);
    this.pendingPassFrom.set(null);
    this.pendingDrawStart = null;
    this.activeOwnerId = null;
    this.clearPathEditing();
    if (this.isDrawing) {
      this.isDrawing = false;
      if (this.livePathObj) { this.fabricCanvas.remove(this.livePathObj); this.livePathObj = null; }
      this.currentPathPoints = [];
      this.fabricCanvas.renderAll();
    }
  }

  onDocumentPointerDown(event: PointerEvent): void {
    if (!this.activePathEdit) return;
    const target = event.target;
    if (!(target instanceof Node)) return;

    const canvasContainer = this.canvasRef().nativeElement.parentElement;
    if (canvasContainer?.contains(target)) return;

    this.clearPathEditing();
  }

  // ── Canvas init ───────────────────────────────────────────────

  private initCanvas(): void {
    const { width, height } = courtCanvasSize(this.courtMode());
    this.fabricCanvas = new Canvas(this.canvasRef().nativeElement, {
      width, height, selection: false,
    });
    this.applyCanvasLayout(this.courtMode());
    drawCourt(this.fabricCanvas, this.courtMode());
    this.attachCanvasEvents();
  }

  private applyCanvasLayout(mode: CourtMode): void {
    const { width, height } = courtCanvasSize(mode);
    this.fabricCanvas.setDimensions({ width, height });
    this.fabricCanvas.setViewportTransform([
      1,
      0,
      0,
      1,
      COURT_OUT_OF_BOUNDS_PADDING,
      COURT_OUT_OF_BOUNDS_PADDING,
    ] as [number, number, number, number, number, number]);
  }

  private placeDefaultPlayers(): void {
    for (let i = 0; i < FIVE_OUT.length; i++) {
      this.spawnToken(`offense-${i + 1}`, 'offense', String(i + 1), FIVE_OUT[i].x, FIVE_OUT[i].y);
    }
    if (this.tokens.length > 0) {
      this.ballCarrierId.set(this.tokens[0].id);
      this.updateBallIndicator();
    }
  }

  switchCourtMode(mode: CourtMode): void {
    if (mode === this.courtMode()) return;
    if (this.tokens.length > 0 && !confirm('Switching court view will reset the play. Continue?')) return;
    this.courtMode.set(mode);
    this.stopAnimation();
    this.wipeState();
    this.fabricCanvas.clear();
    this.applyCanvasLayout(mode);
    drawCourt(this.fabricCanvas, mode);
    this.attachCanvasEvents();
    this.placeDefaultPlayers();
  }

  private wipeState(): void {
    this.clearPathEditing();
    this.tokens = [];
    this.shadowTokens = [];
    this.currentPhasePaths = [];
    this._phases = [];
    this.defenseCount = 0;
    this.ballCarrierId.set(null);
    this.ballIndicator = null;
    this.currentPhaseIndex.set(0);
    this.currentPathCount.set(0);
    this.phaseCount.set(0);
    this.pendingPassFrom.set(null);
  }

  private attachCanvasEvents(): void {
    bindPlayEditorCanvasEvents({
      canvas: this.fabricCanvas,
      getActiveTool: () => this.activeTool(),
      getIsDrawing: () => this.isDrawing,
      getCurrentPhasePaths: () => this.currentPhasePaths,
      getTokens: () => this.tokens,
      getShadowTokens: () => this.shadowTokens,
      getPendingDrawStart: () => this.pendingDrawStart,
      setPendingDrawStart: point => { this.pendingDrawStart = point; },
      getMouseDownPoint: () => this.mouseDownPoint,
      setMouseDownPoint: point => { this.mouseDownPoint = point; },
      getPendingPassFrom: () => this.pendingPassFrom(),
      setPendingPassFrom: playerId => { this.pendingPassFrom.set(playerId); },
      getBallCarrierId: () => this.ballCarrierId(),
      setContextMenu: state => { this.contextMenu.set(state); },
      isPathEditHandle: target => this.isPathEditHandle(target),
      clearPathEditing: () => this.clearPathEditing(),
      startPath: (x, y) => this.startPath(x, y),
      updateLivePath: (x, y) => this.updateLivePath(x, y),
      endPath: (x, y) => this.endPath(x, y),
      beginPathEditing: path => this.beginPathEditing(path),
      executePass: (passerId, receiverId) => this.executePass(passerId, receiverId),
      eraseObject: obj => this.eraseObject(obj),
      applyActivePathControlEdit: () => this.applyActivePathControlEdit(),
      previewActivePathControlEdit: () => this.previewActivePathControlEdit(),
      getGroupCenter: group => this.getGroupCenter(group),
      applyShadowEndpointEdit: (shadow, preservePlaceholder) => this.applyShadowEndpointEdit(shadow, preservePlaceholder),
      updateBallIndicator: () => this.updateBallIndicator(),
    });
  }

  // ── Tool selection ────────────────────────────────────────────

  setTool(tool: Tool): void {
    this.activeTool.set(tool);
    const fc = this.fabricCanvas;
    fc.selection = false;
    if (tool !== 'draw-path') {
      this.pendingAction.set(null);
      this.pendingDrawStart = null;
      this.activeOwnerId = null;
    }
    this.syncCanvasInteractivity();
    fc.renderAll();
  }

  private syncCanvasInteractivity(): void {
    const tool = this.activeTool();
    const shadowGroups = new Set(this.shadowTokens.map(shadow => shadow.fabricGroup));
    const editablePathObjects = new Set<FabricObject>();
    for (const path of this.currentPhasePaths) {
      if (!isEditableMovementPath(this.currentPhasePaths, path)) continue;
      const mainPath = path.fabricObjects[0];
      if (mainPath) editablePathObjects.add(mainPath);
    }

    this.fabricCanvas.forEachObject(o => {
      const isToken = this.tokens.some(t => t.fabricGroup === o);
      const isShadow = shadowGroups.has(o as Group);
      const isPathObject = editablePathObjects.has(o);
      const isEditHandle = this.activePathEdit?.controlHandle === o;
      o.selectable = tool === 'select' && (isToken || isShadow || isEditHandle);
      o.evented = tool === 'erase'
        ? !isShadow && !isEditHandle
        : tool === 'select'
          ? isToken || isShadow || isPathObject || isEditHandle
          : false;
    });
  }

  // ── Player tokens ─────────────────────────────────────────────

  private spawnToken(id: string, type: 'offense' | 'defense', label: string, x: number, y: number): void {
    const group = this.createTokenGroup(type, label, x, y);
    this.tokens.push({ fabricGroup: group, id, type, label, position: { x, y } });
    this.fabricCanvas.add(group);
    this.syncCanvasInteractivity();
    this.fabricCanvas.renderAll();
  }

  private createTokenGroup(
    type: 'offense' | 'defense',
    label: string,
    x: number,
    y: number,
    isShadow = false,
  ): Group {
    const isOff = type === 'offense';
    const circle = new Circle({
      radius: TOKEN_RADIUS,
      fill: isShadow
        ? (isOff ? 'rgba(30,58,95,0.16)' : 'rgba(45,31,63,0.16)')
        : (isOff ? '#1e3a5f' : '#2d1f3f'),
      stroke: isOff ? '#60a5fa' : '#c084fc',
      strokeWidth: 2,
      strokeDashArray: isShadow ? [7, 5] : undefined,
      opacity: isShadow ? 0.75 : 1,
      originX: 'center',
      originY: 'center',
    });
    const text = new FabricText(label, {
      fontSize: 13,
      fontWeight: 'bold',
      fill: isShadow
        ? (isOff ? '#93c5fd' : '#d8b4fe')
        : (isOff ? '#60a5fa' : '#c084fc'),
      opacity: isShadow ? 0.85 : 1,
      originX: 'center',
      originY: 'center',
      fontFamily: 'Inter, system-ui, sans-serif',
    });
    return new Group([circle, text], {
      left: x - TOKEN_RADIUS,
      top: y - TOKEN_RADIUS,
      selectable: this.activeTool() === 'select' && !isShadow,
      evented: this.activeTool() === 'select',
      hasControls: false,
      hasBorders: false,
      hoverCursor: 'pointer',
    });
  }

  private isMovementAction(action: ActionType): boolean {
    return isMovementPathAction(action);
  }

  private isPathEditHandle(target?: FabricObject): boolean {
    return !!target && (target as FabricObject & { __pathEditHandle?: boolean }).__pathEditHandle === true;
  }

  private getGroupCenter(group: Group): Point {
    return {
      x: (group.left ?? 0) + TOKEN_RADIUS,
      y: (group.top ?? 0) + TOKEN_RADIUS,
    };
  }

  private createPathControlHandle(path: PhasePath): Circle {
    return createFabricPathControlHandle(path);
  }

  private clearShadowTokens(): void {
    this.shadowTokens = clearFabricShadowTokens(this.fabricCanvas, this.shadowTokens);
  }

  private removeTaggedPathHandles(except?: Circle): void {
    if (!this.fabricCanvas) return;
    removeFabricTaggedPathHandles(this.fabricCanvas, target => this.isPathEditHandle(target), except);
  }

  private clearPathEditing(): void {
    if (!this.fabricCanvas) return;

    this.removeTaggedPathHandles();

    this.activePathEdit = null;
    this.syncCanvasInteractivity();
    this.fabricCanvas.renderAll();
  }

  private beginPathEditing(path: PhasePath, refreshShadow = true): void {
    if (!isEditableMovementPath(this.currentPhasePaths, path)) return;
    ensureEditableMovementPoints(path);

    if (this.activePathEdit?.path === path) {
      this.activePathEdit.controlHandle.set({ left: path.points[1].x, top: path.points[1].y });
      this.activePathEdit.controlHandle.setCoords();
      this.syncCanvasInteractivity();
      this.fabricCanvas.renderAll();
      return;
    }

    this.clearPathEditing();
    const controlHandle = this.createPathControlHandle(path);
  this.removeTaggedPathHandles();
    this.fabricCanvas.add(controlHandle);
    this.activePathEdit = { path, controlHandle };
    controlHandle.setCoords();
    if (refreshShadow) this.refreshShadowTokens();
    this.syncCanvasInteractivity();
    this.fabricCanvas.renderAll();
  }

  private rebuildEditablePath(path: PhasePath): void {
    if (!this.isMovementAction(path.actionType)) return;
    rebuildFabricEditablePath(this.fabricCanvas, path);
    this.syncCanvasInteractivity();
  }

  private applyActivePathControlEdit(): void {
    applyFabricActivePathControlEdit(
      this.fabricCanvas,
      this.activePathEdit,
      path => this.rebuildEditablePath(path),
      () => this.refreshShadowTokens(),
      () => this.updateBallIndicator(),
      () => this.removeTaggedPathHandles(),
      true,
    );
  }

  private previewActivePathControlEdit(): void {
    applyFabricActivePathControlEdit(
      this.fabricCanvas,
      this.activePathEdit,
      path => this.rebuildEditablePath(path),
      () => this.refreshShadowTokens(),
      () => this.updateBallIndicator(),
      () => this.removeTaggedPathHandles(),
      false,
    );
  }

  private syncDraggedShadowPlaceholder(shadow: ShadowToken, end: Point): void {
    this.shadowTokens = syncFabricDraggedShadowPlaceholder({
      fabricCanvas: this.fabricCanvas,
      tokens: this.tokens,
      shadowTokens: this.shadowTokens,
      shadow,
      end,
      syncCanvasInteractivity: () => this.syncCanvasInteractivity(),
    });
  }

  private applyShadowEndpointEdit(shadow: ShadowToken, preservePlaceholder = false): void {
    applyFabricShadowEndpointEdit({
      fabricCanvas: this.fabricCanvas,
      tokens: this.tokens,
      currentPhasePaths: this.currentPhasePaths,
      shadow,
      activePathEdit: this.activePathEdit,
      preservePlaceholder,
      rebuildEditablePath: path => this.rebuildEditablePath(path),
      beginPathEditing: (path, refreshShadow) => this.beginPathEditing(path, refreshShadow),
      refreshShadowTokens: () => this.refreshShadowTokens(),
      syncDraggedShadowPlaceholder: (candidate, end) => this.syncDraggedShadowPlaceholder(candidate, end),
      updateBallIndicator: () => this.updateBallIndicator(),
    });
  }

  private refreshShadowTokens(): void {
    this.shadowTokens = refreshFabricShadowTokens({
      fabricCanvas: this.fabricCanvas,
      tokens: this.tokens,
      currentPhasePaths: this.currentPhasePaths,
      shadowTokens: this.shadowTokens,
      activePathEdit: this.activePathEdit,
      createTokenGroup: (type, label, x, y, isShadow) => this.createTokenGroup(type, label, x, y, isShadow),
      clearPathEditing: () => this.clearPathEditing(),
      syncCanvasInteractivity: () => this.syncCanvasInteractivity(),
    });
  }

  addDefensePlayer(): void {
    const { W, H } = courtSize(this.courtMode());
    this.defenseCount++;
    this.spawnToken(`defense-${Date.now()}`, 'defense', 'X', Math.round(W * 0.45), Math.round(H / 2));
  }

  // ── Ball indicator ────────────────────────────────────────────

  private updateBallIndicator(): void {
    if (this.ballIndicator) { this.fabricCanvas.remove(this.ballIndicator); this.ballIndicator = null; }
    const carrier = this.tokens.find(t => t.id === this.ballCarrierId());
    if (!carrier) { this.fabricCanvas.renderAll(); return; }
    const anchor = getCurrentAnchorPosition(this.tokens, this.currentPhasePaths, carrier.id) ?? carrier.position;
    const placement = resolveCarrierBallIndicatorState(anchor);
    this.ballIndicator = new Circle({
      radius: BALL_INDICATOR_RADIUS, fill: '#f97316', stroke: '#7c2d12', strokeWidth: 1.5,
      left: placement.left ?? 0, top: placement.top ?? 0,
      selectable: false, evented: false,
    });
    this.fabricCanvas.add(this.ballIndicator);
    this.fabricCanvas.renderAll();
  }

  private ensureBallIndicator(): void {
    if (this.ballIndicator) return;
    this.ballIndicator = new Circle({
      radius: BALL_INDICATOR_RADIUS,
      fill: '#f97316',
      stroke: '#7c2d12',
      strokeWidth: 1.5,
      left: 0,
      top: 0,
      selectable: false,
      evented: false,
      visible: false,
    });
    this.fabricCanvas.add(this.ballIndicator);
  }

  private bringBallIndicatorToFront(): void {
    if (!this.ballIndicator) return;
    this.fabricCanvas.remove(this.ballIndicator);
    this.fabricCanvas.add(this.ballIndicator);
  }

  private clearAnimatedPhaseObjects(): void {
    if (this.animatedPhaseObjects.length === 0) return;
    this.animatedPhaseObjects.forEach(obj => this.fabricCanvas.remove(obj));
    this.animatedPhaseObjects = [];
  }

  private lerpPoint(a: Point, b: Point, t: number): Point {
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
    };
  }

  private splitQuadraticFrom(start: Point, control: Point, end: Point, t: number): Point[] {
    const q0 = this.lerpPoint(start, control, t);
    const q1 = this.lerpPoint(control, end, t);
    const r0 = this.lerpPoint(q0, q1, t);
    return [r0, q1, end];
  }

  private buildPhasePathSchedule(phase: Phase): ScheduledPath[] {
    return createPhasePathSchedule(phase);
  }

  private getScheduledPathCoverage(path: ScheduledPath, t: number): number {
    return resolveScheduledPathCoverage(path, t);
  }

  private getRemainingPathPoints(action: ActionType, points: Point[], coverage: number): Point[] | null {
    return resolveRemainingPathPoints(action, points, coverage);
  }

  private createAnimatedPathObjects(path: StoredPath, coverage: number): FabricObject[] {
    const remainingPoints = this.getRemainingPathPoints(path.actionType, path.points, coverage);
    if (!remainingPoints || remainingPoints.length < 2) return [];

    return renderActionPathObjects({
      canvas: this.fabricCanvas,
      actionType: path.actionType,
      points: remainingPoints,
      style: PATH_STYLES[path.actionType],
      opacity: path.actionType === 'shoot' ? undefined : 0.9,
      preferLinePath: true,
    });
  }

  private updateAnimatedPhaseObjects(phase: Phase, scheduledPaths: ScheduledPath[], t: number): void {
    this.clearAnimatedPhaseObjects();
    if (!this.showAnimatedLines()) return;

    for (const scheduledPath of scheduledPaths) {
      const coverage = this.getScheduledPathCoverage(scheduledPath, t);
      this.animatedPhaseObjects.push(...this.createAnimatedPathObjects(scheduledPath.path, coverage));
    }

    this.bringBallIndicatorToFront();
  }

  // ── Context menu ──────────────────────────────────────────────

  closeContextMenu(): void { this.contextMenu.set(null); }

  setBallCarrier(playerId: string): void {
    this.ballCarrierId.set(playerId);
    this.contextMenu.set(null);
    this.updateBallIndicator();
  }

  selectAction(action: ActionType): void {
    const menu = this.contextMenu();
    if (!menu) return;
    const token = findPlayerToken(this.tokens, menu.playerId);
    const anchor = getCurrentAnchorPosition(this.tokens, this.currentPhasePaths, menu.playerId);
    if (!token || !anchor) { this.contextMenu.set(null); return; }
    this.clearPathEditing();
    this.contextMenu.set(null);

    if (action === 'shoot') {
      this.drawShootArc(token.id, anchor);
      this.ballCarrierId.set(null);
      this.updateBallIndicator();
      return;
    }

    if (action === 'pass') {
      this.pendingPassFrom.set(token.id);
      this.setTool('select');
      return;
    }

    this.pendingAction.set(action);
    this.activeOwnerId = menu.playerId;
    this.pendingDrawStart = anchor;
    this.setTool('draw-path');
  }

  private executePass(passerId: string, receiverId: string): void {
    const passer = this.tokens.find(t => t.id === passerId);
    const receiver = this.tokens.find(t => t.id === receiverId);
    if (!passer || !receiver) return;

    const from = getCurrentAnchorPosition(this.tokens, this.currentPhasePaths, passerId) ?? passer.position;
    const to = getCurrentAnchorPosition(this.tokens, this.currentPhasePaths, receiverId) ?? receiver.position;
    const storedPath = buildPassStoredPath(passerId, receiverId, from, to);

    const fabricObjects = renderActionPathObjects({
      canvas: this.fabricCanvas,
      actionType: storedPath.actionType,
      points: storedPath.points,
      style: PATH_STYLES[storedPath.actionType],
      evented: true,
    });
    this.fabricCanvas.renderAll();

    this.currentPhasePaths.push({ ...storedPath, fabricObjects });
    this.currentPathCount.set(this.currentPhasePaths.length);

    this.ballCarrierId.set(receiverId);
    this.updateBallIndicator();
  }

  private drawShootArc(ownerId: string, from: Point): void {
    const storedPath = buildShootStoredPath(ownerId, from);
    const fabricObjects = renderActionPathObjects({
      canvas: this.fabricCanvas,
      actionType: storedPath.actionType,
      points: storedPath.points,
      style: PATH_STYLES[storedPath.actionType],
      evented: true,
    });
    this.fabricCanvas.renderAll();
    this.currentPhasePaths.push({ ...storedPath, fabricObjects });
    this.currentPathCount.set(this.currentPhasePaths.length);
  }

  // ── Path drawing ──────────────────────────────────────────────

  private startPath(x: number, y: number): void {
    this.isDrawing = true;
    this.currentPathPoints = [{ x, y }];
  }

  private updateLivePath(x: number, y: number): void {
    if (!this.isDrawing) return;
    const nextPoints = appendDrawPoint(this.currentPathPoints, { x, y });
    if (nextPoints === this.currentPathPoints) return;
    this.currentPathPoints = nextPoints;

    const previewPoints = this.currentPathPoints.length > 1
      ? buildDrawnMovementStoredPath({
        ownerId: this.activeOwnerId ?? '',
        actionType: this.pendingAction() ?? 'dribble',
        samples: this.currentPathPoints.slice(0, -1),
        endPoint: this.currentPathPoints[this.currentPathPoints.length - 1],
      })?.points ?? this.currentPathPoints
      : this.currentPathPoints;

    if (this.livePathObj) this.fabricCanvas.remove(this.livePathObj);
    const style = PATH_STYLES[this.pendingAction() ?? 'dribble'];
    const [previewPath] = renderActionPathObjects({
      canvas: this.fabricCanvas,
      actionType: this.pendingAction() ?? 'dribble',
      points: previewPoints,
      style,
      opacity: 0.65,
      includeMarker: false,
    });
    this.livePathObj = previewPath as Path;
    this.fabricCanvas.renderAll();
  }

  private endPath(x: number, y: number): void {
    if (this.livePathObj) { this.fabricCanvas.remove(this.livePathObj); this.livePathObj = null; }
    if (!this.isDrawing) return;
    this.isDrawing = false;

    const action = this.pendingAction() ?? 'dribble';
    const ownerId = this.activeOwnerId ?? '';
    this.activeOwnerId = null;
    const storedPath = buildDrawnMovementStoredPath({
      ownerId,
      actionType: action,
      samples: this.currentPathPoints,
      endPoint: { x, y },
    });
    this.currentPathPoints = [];

    if (!storedPath) {
      this.setTool('select');
      return;
    }

    const fabricObjects = renderActionPathObjects({
      canvas: this.fabricCanvas,
      actionType: storedPath.actionType,
      points: storedPath.points,
      style: PATH_STYLES[storedPath.actionType],
      evented: true,
    });

    this.fabricCanvas.renderAll();
    this.currentPhasePaths.push({ ...storedPath, fabricObjects });
    this.currentPathCount.set(this.currentPhasePaths.length);
    this.refreshShadowTokens();
    this.updateBallIndicator();
    this.setTool('select');
  }

  // ── Erase ─────────────────────────────────────────────────────

  private eraseObject(obj: FabricObject): void {
    const result = erasePlayEditorObject({
      fabricCanvas: this.fabricCanvas,
      tokens: this.tokens,
      currentPhasePaths: this.currentPhasePaths,
      ballCarrierId: this.ballCarrierId(),
      ballIndicator: this.ballIndicator,
      activePathEdit: this.activePathEdit,
      object: obj,
      clearPathEditing: () => this.clearPathEditing(),
    });
    if (!result.erased) return;

    this.tokens = result.tokens;
    this.currentPhasePaths = result.currentPhasePaths;
    this.currentPathCount.set(this.currentPhasePaths.length);
    this.ballCarrierId.set(result.ballCarrierId);
    this.ballIndicator = result.ballIndicator;
    this.refreshShadowTokens();
    this.updateBallIndicator();
    this.fabricCanvas.renderAll();
  }

  clearAllPaths(): void {
    if (this.currentPhasePaths.length === 0) return;
    this.clearPathEditing();
    this.currentPhasePaths.forEach(p => p.fabricObjects.forEach(o => this.fabricCanvas.remove(o)));
    this.currentPhasePaths = [];
    this.currentPathCount.set(0);
    this.refreshShadowTokens();
    this.updateBallIndicator();
    this.fabricCanvas.renderAll();
  }

  // ── Phase management ───────────────────────────────────────────

  nextPhase(): void {
    if (this.currentPhasePaths.length === 0) return;
    this.clearPathEditing();

    this._phases.push({
      playerPositions: Object.fromEntries(this.tokens.map(t => [t.id, { ...t.position }])),
      ballCarrierId: this.ballCarrierId(),
      paths: this.currentPhasePaths.map(p => ({
        ownerId: p.ownerId,
        actionType: p.actionType,
        points: p.points.map(point => ({ ...point })),
        targetId: p.targetId,
      })),
    });
    this.phaseCount.set(this._phases.length);
    this.currentPhaseIndex.set(this._phases.length);

    // Advance tokens to their path endpoints (skip pass & shoot — only the ball moves)
    advanceTokensToPathEndpoints(this.tokens, this.currentPhasePaths);

    this.currentPhasePaths.forEach(p => p.fabricObjects.forEach(o => this.fabricCanvas.remove(o)));
    this.currentPhasePaths = [];
    this.currentPathCount.set(0);

    this.clearShadowTokens();
    this.syncCanvasInteractivity();
    this.updateBallIndicator();
    this.fabricCanvas.renderAll();
  }

  // ── Animation ─────────────────────────────────────────────────

  async previewPlay(): Promise<void> {
    if (this._phases.length === 0) return;
    this.clearPathEditing();
    this.clearAnimatedPhaseObjects();
    this.ensureBallIndicator();

    // Save the current editing positions so we can restore them after preview
    const savedPositions = captureTokenPositions(this.tokens);
    const savedBallCarrier = this.ballCarrierId();

    // Hide current phase paths during preview
    this.currentPhasePaths.forEach(p => p.fabricObjects.forEach(o => o.set({ visible: false })));

    // Reset all tokens to phase 0 starting positions
    syncTokensToPhasePositions(this.tokens, this._phases[0].playerPositions);

    const initialSchedule = this.buildPhasePathSchedule(this._phases[0]);
    this.positionBallAtPhaseStart(this._phases[0], initialSchedule);
    this.fabricCanvas.renderAll();

    this.animState.set('playing');

    try {
      for (const [i, phase] of this._phases.entries()) {
        if (!this.isPlaying()) break;
        this.animProgress.set(i / this._phases.length);
        await this.animatePhase(phase);
      }
      // Brief pause at the end so user can see final state
      if (this.isPlaying()) {
        this.animProgress.set(1);
        await new Promise(r => setTimeout(r, 600));
      }
    } finally {
      this.animState.set('idle');
      this.animProgress.set(0);

      // Restore saved editing positions
      restoreSavedTokenPositions(this.tokens, savedPositions);
      this.ballCarrierId.set(savedBallCarrier);
      this.clearAnimatedPhaseObjects();
      this.updateBallIndicator();

      // Restore current phase paths visibility
      this.currentPhasePaths.forEach(p => p.fabricObjects.forEach(o => o.set({ visible: true })));
      this.fabricCanvas.renderAll();
    }
  }

  private animatePhase(phase: Phase): Promise<void> {
    return new Promise(resolve => {
      this.activeAnimResolve = resolve;
      const scheduledPaths = this.buildPhasePathSchedule(phase);
      this.ensureBallIndicator();

      // Position all tokens at their starting positions for this phase
      syncTokensToPhasePositions(this.tokens, phase.playerPositions);

      // Position ball indicator at starting location
      this.positionBallAtPhaseStart(phase, scheduledPaths);
      this.updateAnimatedPhaseObjects(phase, scheduledPaths, 0);
      this.fabricCanvas.renderAll();

      // Brief pause at start so the user can see the initial setup
      const PRE_DELAY = 300;
      setTimeout(() => {
        if (!this.isPlaying()) {
          this.clearAnimatedPhaseObjects();
          this.fabricCanvas.renderAll();
          this.activeAnimResolve = null;
          resolve();
          return;
        }

        const duration = this.ANIM_DURATION / this.animSpeed();
        const start = performance.now();

        const tick = (now: number) => {
          if (!this.isPlaying()) {
            this.activeAnimResolve = null;
            resolve();
            return;
          }
          const t = Math.min((now - start) / duration, 1);

          // Animate player movement (skip pass & shoot — only the ball moves for those)
          syncTokensToResolvedPositions(
            this.tokens,
            token => this.getPlayerPositionAtTime(token.id, phase, scheduledPaths, t),
          );

          // Animate ball
          this.animateBallForPhase(phase, scheduledPaths, t);
          this.updateAnimatedPhaseObjects(phase, scheduledPaths, t);

          this.fabricCanvas.renderAll();

          if (t < 1) {
            this.animFrameId = requestAnimationFrame(tick);
          } else {
            // Snap tokens to exact final positions for precision
            syncTokensToResolvedPositions(
              this.tokens,
              token => this.getPlayerPositionAtTime(token.id, phase, scheduledPaths, 1),
            );
            this.clearAnimatedPhaseObjects();
            this.fabricCanvas.renderAll();
            this.activeAnimResolve = null;
            resolve();
          }
        };
        this.animFrameId = requestAnimationFrame(tick);
      }, PRE_DELAY);
    });
  }

  private getPlayerPositionAtTime(ownerId: string, phase: Phase, scheduledPaths: ScheduledPath[], t: number): Point | null {
    return resolvePlayerPositionAtTime(ownerId, phase, scheduledPaths, t);
  }

  private positionBallAtPhaseStart(phase: Phase, scheduledPaths: ScheduledPath[]): void {
    if (!this.ballIndicator) return;
    this.ballIndicator.set(resolveBallIndicatorState(phase, scheduledPaths, 0));
  }

  private animateBallForPhase(phase: Phase, scheduledPaths: ScheduledPath[], t: number): void {
    if (!this.ballIndicator) return;
    this.ballIndicator.set(resolveBallIndicatorState(phase, scheduledPaths, t));
  }

  stopAnimation(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.clearAnimatedPhaseObjects();
    if (this.activeAnimResolve) {
      const resolve = this.activeAnimResolve;
      this.activeAnimResolve = null;
      resolve();
    }
    this.animState.set('idle');
    this.animProgress.set(0);
  }

  // ── Save / Load ───────────────────────────────────────────────

  async save(): Promise<void> {
    if (this.saving()) return;
    this.clearPathEditing();
    this.saving.set(true);
    try {
      const state = buildPlayEditorStateSnapshot({
        tokens: this.tokens,
        phases: this._phases,
        ballCarrierId: this.ballCarrierId(),
        currentPhaseIndex: this.currentPhaseIndex(),
        currentPhasePaths: this.currentPhasePaths,
        courtMode: this.courtMode(),
      });
      const play = buildPlaySavePayload({
        playId: this.playId(),
        name: this.playName(),
        description: this.playDesc(),
        category: this.playCat(),
        state,
        thumbnail: this.fabricCanvas.toDataURL({ multiplier: 1, format: 'jpeg', quality: 0.6 }),
      });
      const id = await this.playService.save(play);
      if (!this.playId()) {
        this.playId.set(id);
        this.router.navigate(['/playbook', id], { replaceUrl: true });
      }
    } finally {
      this.saving.set(false);
    }
  }

  private async loadPlay(): Promise<void> {
    const play = await this.playService.get(this.playId()!);
    if (!play) return;
    this.playName.set(play.name);
    this.playDesc.set(play.description ?? '');
    this.playCat.set(play.category);

    const parsedCanvasState = parsePlayEditorCanvasState(play.canvas_state);
    if (parsedCanvasState.kind === 'empty' || parsedCanvasState.kind === 'invalid') {
      this.placeDefaultPlayers();
      return;
    }

    if (parsedCanvasState.kind === 'legacy') {
      try {
        await this.fabricCanvas.loadFromJSON(parsedCanvasState.state as string | Record<string, any>);
        this.fabricCanvas.renderAll();
      } catch {
        this.placeDefaultPlayers();
      }
      return;
    }

    const state = parsedCanvasState.state;
    if (state.courtMode !== this.courtMode()) {
      this.courtMode.set(state.courtMode);
      this.fabricCanvas.clear();
      this.applyCanvasLayout(state.courtMode);
      drawCourt(this.fabricCanvas, state.courtMode);
      this.attachCanvasEvents();
    }

    for (const token of state.tokens) {
      this.spawnToken(token.id, token.type, token.label, token.position.x, token.position.y);
    }

    this._phases = state.phases;
    this.phaseCount.set(this._phases.length);
    this.ballCarrierId.set(state.ballCarrierId);
    this.currentPhaseIndex.set(state.currentPhaseIndex);

    for (const path of state.currentPhasePaths) {
      this.redrawStoredPath(path);
    }

    this.refreshShadowTokens();
    this.updateBallIndicator();
  }

  private redrawStoredPath(p: StoredPath): void {
    const fabricObjects = renderActionPathObjects({
      canvas: this.fabricCanvas,
      actionType: p.actionType,
      points: p.points,
      style: PATH_STYLES[p.actionType],
      evented: true,
    });
    this.fabricCanvas.renderAll();
    this.currentPhasePaths.push({
      ownerId: p.ownerId,
      actionType: p.actionType,
      points: p.points,
      targetId: p.targetId,
      fabricObjects,
    });
    this.currentPathCount.set(this.currentPhasePaths.length);
  }

  // ── Export: Video ─────────────────────────────────────────────

  exportVideo(): void {
    if (this._phases.length === 0) { alert('No phases recorded yet.'); return; }
    exportPlayEditorVideo({
      canvasElement: this.canvasRef().nativeElement as HTMLCanvasElement,
      phases: this._phases,
      downloadFilename: toDownloadFilename(this.playName(), 'webm'),
      isPlaying: () => this.isPlaying(),
      animatePhase: phase => this.animatePhase(phase),
      onStart: () => {
        this.animState.set('playing');
      },
      onFinish: () => {
        syncTokensToStoredPositions(this.tokens);
        this.fabricCanvas.renderAll();
        this.updateBallIndicator();
        this.animState.set('idle');
      },
    });
  }

  // ── Export: PDF ───────────────────────────────────────────────

  async exportPdf(): Promise<void> {
    if (this._phases.length === 0) return;
    this.clearPathEditing();
    await exportPlayEditorPdf({
      canvas: this.fabricCanvas,
      phases: this._phases,
      tokens: this.tokens,
      courtMode: this.courtMode(),
      playName: this.playName(),
      downloadFilename: toDownloadFilename(this.playName(), 'pdf'),
    });
  }

  back(): void { this.router.navigate(['/playbook']); }
}
