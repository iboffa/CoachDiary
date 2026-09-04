import {
  Component, ElementRef, OnDestroy,
  afterNextRender, computed, inject, signal, viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AiCoachModalComponent } from '../ai-coach-modal/ai-coach-modal.component';
import { PlayEditorState } from '../../../core/services/rag.service';
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
import { PlayCategory } from '../../../shared/models/models';
import {
  BALL_INDICATOR_RADIUS,
  FIVE_OUT,
  MOBILE_PATH_HANDLE_RADIUS,
  MOBILE_TOKEN_RADIUS,
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
  ShadowToken,
  StoredPath,
  Tool,
} from './play-editor.models';
import {
  getCarrierBallIndicatorState as resolveCarrierBallIndicatorState,
  isMovementAction as isMovementPathAction,
} from './play-editor-path.utils';
import { PlayAnimationController } from './play-editor-animation-controller';
import { PlaySaveController } from './play-editor-save-controller';
import { renderActionPathObjects } from './play-editor-fabric.utils';
import {
  ensureEditableMovementPoints,
  findPlayerToken,
  getCurrentAnchorPosition,
  isEditableMovementPath,
} from './play-editor-editing.utils';
import {
  buildPlayEditorStateSnapshot,
  parsePlayEditorCanvasState,
  PlayEditorPersistedState,
  toDownloadFilename,
} from './play-editor-persistence.utils';
import {
  advanceTokensToPathEndpoints,
  captureTokenPositions,
  restoreSavedTokenPositions,
  SavedTokenPosition,
  syncTokensToPhasePositions,
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

const COURT_WRAPPER_PADDING = 16; // must match .court-wrapper padding in play-editor.component.scss
const CTX_MENU_EST_WIDTH = 180; // generous estimate — the menu has no fixed size to measure ahead of layout
const CTX_MENU_EST_HEIGHT = 240;
const CTX_MENU_MARGIN = 8;

interface UndoSnapshot {
  phasePaths: StoredPath[];
  tokens: Array<{ id: string; type: 'offense' | 'defense'; label: string; position: Point }>;
  ballCarrierId: string | null;
  defenseCount: number;
}

@Component({
  selector: 'app-play-editor',
  imports: [FormsModule, AiCoachModalComponent],
  templateUrl: './play-editor.component.html',
  styleUrl: './play-editor.component.scss',
  host: {
    '(document:keydown.escape)': 'onEscape()',
    '(document:keydown.delete)': 'onDeleteKey()',
    '(document:keydown.backspace)': 'onDeleteKey()',
    '(document:keydown.control.z)': 'undo()',
    '(document:pointerdown)': 'onDocumentPointerDown($event)',
  },
})
export class PlayEditorComponent implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly playService = inject(PlayService);
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('courtCanvas');
  private readonly courtWrapperRef = viewChild.required<ElementRef<HTMLElement>>('courtWrapper');
  private fabricCanvas!: Canvas;
  private readonly onWindowResize = () => this.fitCanvasToContainer();

  // ── Reactive signals ──────────────────────────────────────────
  readonly playId    = signal<string | null>(null);
  readonly playName  = signal('New Play');
  readonly playDesc  = signal('');
  readonly playCat   = signal<string | undefined>(undefined);
  readonly courtMode = signal<CourtMode>('half');
  readonly categories = signal<PlayCategory[]>([]);
  newCategoryName = '';

  readonly activeTool    = signal<Tool>('select');
  readonly animState     = signal<AnimState>('idle');
  readonly animSpeed     = signal(1);
  readonly animProgress  = signal(0);
  readonly showAnimatedLines = signal(true);
  readonly saving        = signal(false);
  readonly duplicating   = signal(false);
  readonly savingTemplate = signal(false);

  readonly ballCarrierId     = signal<string | null>(null);
  readonly contextMenu       = signal<ContextMenuState | null>(null);
  readonly pendingAction     = signal<ActionType | null>(null);
  readonly currentPathCount  = signal(0);
  readonly phaseCount        = signal(0);
  readonly currentPhaseIndex = signal(0);
  readonly pendingPassFrom   = signal<string | null>(null);

  readonly isPlaying   = computed(() => this.animState() === 'playing');
  readonly isPaused    = computed(() => this.animState() === 'paused');
  readonly isAnimating = computed(() => this.animState() !== 'idle');
  readonly canPreview  = computed(() => this.phaseCount() > 0);
  private readonly undoStackSize = signal(0);
  readonly canUndo     = computed(() => this.undoStackSize() > 0);
  readonly pathSelected = signal(false);


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
  private selectedPathObject: FabricObject | null = null;
  private mouseDownPoint: Point | null = null;
  private ballIndicator: Circle | null = null;

  private undoStack: UndoSnapshot[] = [];
  private editingPhaseIndex: number | null = null;
  private editingPhaseModified = false;
  private savedEditingState: {
    phasePaths: StoredPath[];
    tokenPositions: SavedTokenPosition[];
    ballCarrierId: string | null;
  } | null = null;

  private readonly animController = new PlayAnimationController({
    getCanvas: () => this.fabricCanvas,
    getTokens: () => this.tokens,
    getPhases: () => this._phases,
    getCurrentPhasePaths: () => this.currentPhasePaths,
    getBallCarrierId: () => this.ballCarrierId(),
    setBallCarrierId: id => this.ballCarrierId.set(id),
    getBallIndicator: () => this.ballIndicator,
    setBallIndicator: indicator => { this.ballIndicator = indicator; },
    getAnimSpeed: () => this.animSpeed(),
    getShowAnimatedLines: () => this.showAnimatedLines(),
    getAnimState: () => this.animState(),
    setAnimState: state => this.animState.set(state),
    setAnimProgress: progress => this.animProgress.set(progress),
    clearPathEditing: () => this.clearPathEditing(),
    clearShadowTokens: () => this.clearShadowTokens(),
    refreshShadowTokens: () => this.refreshShadowTokens(),
    bringTokensToFront: () => this.bringTokensToFront(),
    updateBallIndicator: () => this.updateBallIndicator(),
  });

  private readonly saveController = new PlaySaveController({
    getCanvas: () => this.fabricCanvas,
    getSnapshot: () => this.buildStateSnapshot(),
    getPlayDesc: () => this.playDesc(),
    getPlayCat: () => this.playCat(),
    save: play => this.playService.save(play),
  });

  get phases(): Phase[] { return this._phases; }

  private buildStateSnapshot(): PlayEditorPersistedState {
    return buildPlayEditorStateSnapshot({
      tokens: this.tokens,
      phases: this._phases,
      ballCarrierId: this.ballCarrierId(),
      currentPhaseIndex: this.currentPhaseIndex(),
      currentPhasePaths: this.currentPhasePaths,
      courtMode: this.courtMode(),
    });
  }

  getCurrentPlay = (): PlayEditorState => this.buildStateSnapshot() as unknown as PlayEditorState;

  readonly teamId: string | null = PlayEditorComponent.parseRouteId(
    this.route.snapshot.paramMap.get('teamId'));
  private readonly oppId: string | null = PlayEditorComponent.parseRouteId(
    this.route.snapshot.paramMap.get('oppId'));

  private static parseRouteId(raw: string | null): string | null {
    return raw ?? null;
  }

  private get listPath(): (string | number)[] {
    if (this.oppId !== null && this.teamId !== null) {
      return ['/teams', this.teamId, 'opponents', this.oppId, 'playbook'];
    }
    if (this.teamId !== null) return ['/teams', this.teamId, 'playbook'];
    return ['/playbook'];
  }

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') this.playId.set(id);

    if (this.teamId !== null) this.loadCategories();

    afterNextRender(() => {
      this.initCanvas();
      this.fitCanvasToContainer();
      window.addEventListener('resize', this.onWindowResize);
      if (this.playId()) this.loadPlay();
      else this.placeDefaultPlayers();
    });
  }

  ngOnDestroy(): void {
    this.stopAnimation();
    window.removeEventListener('resize', this.onWindowResize);
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

  // Below the mobile breakpoint .editor-body's CSS switches from a row to a
  // column (see SCSS) — read that back instead of duplicating the breakpoint
  // value here, so this stays in sync with the actual layout.
  private isStackedLayout(): boolean {
    const wrapper = this.courtWrapperRef().nativeElement;
    return getComputedStyle(wrapper.parentElement!).flexDirection === 'column';
  }

  private fitCanvasToContainer(): void {
    if (!this.fabricCanvas) return;
    const wrapper = this.courtWrapperRef().nativeElement;
    const { width: baseWidth, height: baseHeight } = courtCanvasSize(this.courtMode());
    const availWidth = wrapper.clientWidth - COURT_WRAPPER_PADDING * 2;
    if (availWidth <= 0) return;

    // .court-wrapper no longer flex-grows to fill leftover height when stacked
    // (see SCSS) — its clientHeight there is just "whatever the canvas currently
    // is", not a real budget. Scale from width alone in that case, which would
    // otherwise shrink the canvas to fit its own last-frame size.
    let scale: number;
    if (this.isStackedLayout()) {
      scale = availWidth / baseWidth;
    } else {
      const availHeight = wrapper.clientHeight - COURT_WRAPPER_PADDING * 2;
      if (availHeight <= 0) return;
      scale = Math.min(availWidth / baseWidth, availHeight / baseHeight);
    }
    const clampedScale = Math.min(Math.max(scale, 0.3), 2.5);

    this.fabricCanvas.setDimensions({
      width: baseWidth * clampedScale,
      height: baseHeight * clampedScale,
    });
    this.fabricCanvas.setViewportTransform([
      clampedScale,
      0,
      0,
      clampedScale,
      COURT_OUT_OF_BOUNDS_PADDING * clampedScale,
      COURT_OUT_OF_BOUNDS_PADDING * clampedScale,
    ]);
    this.fabricCanvas.renderAll();
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
    this.fitCanvasToContainer();
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
    this.editingPhaseIndex = null;
    this.editingPhaseModified = false;
    this.savedEditingState = null;
    this.clearUndoStack();
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
      findPathByObject: target => this.findPathByObject(target),
      setSelectedPathObject: target => { this.setSelectedPathObject(target); },
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
      radius: this.isStackedLayout() ? MOBILE_TOKEN_RADIUS : TOKEN_RADIUS,
      fill: isShadow
        ? (isOff ? 'rgba(30,64,175,0.35)' : 'rgba(109,40,217,0.35)')
        : (isOff ? '#1e3a5f' : '#2d1f3f'),
      stroke: isShadow
        ? (isOff ? '#1d4ed8' : '#7c3aed')
        : (isOff ? '#60a5fa' : '#c084fc'),
      strokeWidth: isShadow ? 2.5 : 2,
      strokeDashArray: isShadow ? [7, 5] : undefined,
      opacity: isShadow ? 0.9 : 1,
      originX: 'center',
      originY: 'center',
    });
    const text = new FabricText(label, {
      fontSize: 13,
      fontWeight: 'bold',
      fill: isShadow
        ? '#ffffff'
        : (isOff ? '#60a5fa' : '#c084fc'),
      opacity: isShadow ? 0.9 : 1,
      originX: 'center',
      originY: 'center',
      fontFamily: 'Inter, system-ui, sans-serif',
    });
    return new Group([circle, text], {
      left: x,
      top: y,
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
      x: group.left ?? 0,
      y: group.top ?? 0,
    };
  }

  private createPathControlHandle(path: PhasePath): Circle {
    return createFabricPathControlHandle(
      path,
      this.isStackedLayout() ? MOBILE_PATH_HANDLE_RADIUS : undefined,
    );
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
    this.selectedPathObject = null;
    this.updatePathSelectedState();
    this.syncCanvasInteractivity();
    this.fabricCanvas.renderAll();
  }

  private beginPathEditing(path: PhasePath, refreshShadow = true): void {
    if (!isEditableMovementPath(this.currentPhasePaths, path)) {
      this.clearPathEditing();
      this.setSelectedPathObject(path.fabricObjects[0] ?? null);
      return;
    }
    ensureEditableMovementPoints(path);

    if (this.activePathEdit?.path === path) {
      this.activePathEdit.controlHandle.set({ left: path.points[1].x, top: path.points[1].y });
      this.activePathEdit.controlHandle.setCoords();
      this.syncCanvasInteractivity();
      this.fabricCanvas.renderAll();
      return;
    }

    this.pushUndoSnapshot();
    this.clearPathEditing();
    const controlHandle = this.createPathControlHandle(path);
  this.removeTaggedPathHandles();
    this.fabricCanvas.add(controlHandle);
    this.activePathEdit = { path, controlHandle };
    this.selectedPathObject = null;
    this.updatePathSelectedState();
    controlHandle.setCoords();
    if (refreshShadow) this.refreshShadowTokens();
    this.syncCanvasInteractivity();
    this.fabricCanvas.renderAll();
  }

  private findPathByObject(target?: FabricObject): PhasePath | null {
    if (!target) return null;
    return this.currentPhasePaths.find(path => path.fabricObjects.includes(target)) ?? null;
  }

  private setSelectedPathObject(target: FabricObject | null): void {
    this.selectedPathObject = target;
    this.updatePathSelectedState();
    this.fabricCanvas.renderAll();
  }

  private updatePathSelectedState(): void {
    this.pathSelected.set(!!this.activePathEdit || !!this.selectedPathObject);
  }

  private rebuildEditablePath(path: PhasePath): void {
    if (!this.isMovementAction(path.actionType)) return;
    rebuildFabricEditablePath(this.fabricCanvas, path);
    this.bringTokensToFront();
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
    this.markPhaseModified();
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
    if (this.isPlayFinalized()) return;
    this.pushUndoSnapshot();
    const { W, H } = courtSize(this.courtMode());
    this.defenseCount++;
    this.spawnToken(`defense-${Date.now()}`, 'defense', 'X', Math.round(W * 0.45), Math.round(H / 2));
  }

  private isPlayFinalized(): boolean {
    if (this.editingPhaseIndex !== null) return false;
    if (this.currentPhasePaths.length > 0) return false;
    const lastPhase = this._phases.at(-1);
    return !!lastPhase?.paths.some(path => path.actionType === 'shoot');
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

  private bringBallIndicatorToFront(): void {
    if (!this.ballIndicator) return;
    this.fabricCanvas.remove(this.ballIndicator);
    this.fabricCanvas.add(this.ballIndicator);
  }

  private bringTokensToFront(): void {
    for (const token of this.tokens) {
      this.fabricCanvas.bringObjectToFront(token.fabricGroup);
    }
    for (const shadow of this.shadowTokens) {
      this.fabricCanvas.bringObjectToFront(shadow.fabricGroup);
    }
    this.bringBallIndicatorToFront();
  }

  // ── Context menu ──────────────────────────────────────────────

  closeContextMenu(): void { this.contextMenu.set(null); }

  // Keeps the menu fully on-screen — on narrow viewports a tap near the
  // right/bottom edge of the (now full-width) court would otherwise open
  // it partly or fully off-screen and unreachable.
  contextMenuLeft(): number {
    const menu = this.contextMenu();
    if (!menu) return 0;
    const maxLeft = window.innerWidth - CTX_MENU_EST_WIDTH - CTX_MENU_MARGIN;
    return Math.max(CTX_MENU_MARGIN, Math.min(menu.clientX + CTX_MENU_MARGIN, maxLeft));
  }

  contextMenuTop(): number {
    const menu = this.contextMenu();
    if (!menu) return 0;
    const maxTop = window.innerHeight - CTX_MENU_EST_HEIGHT - CTX_MENU_MARGIN;
    return Math.max(CTX_MENU_MARGIN, Math.min(menu.clientY - CTX_MENU_MARGIN, maxTop));
  }

  setBallCarrier(playerId: string): void {
    if (this.isPlayFinalized()) {
      this.contextMenu.set(null);
      return;
    }
    this.ballCarrierId.set(playerId);
    this.contextMenu.set(null);
    this.updateBallIndicator();
  }

  canRemovePlayerPass(playerId: string): boolean {
    return this.findLatestPlayerPath(playerId, action => action === 'pass' || action === 'dribble-handoff') !== null;
  }

  canRemovePlayerShoot(playerId: string): boolean {
    return this.findLatestPlayerPath(playerId, action => action === 'shoot') !== null;
  }

  removePlayerPass(playerId: string): void {
    this.removeLatestPlayerPath(playerId, action => action === 'pass' || action === 'dribble-handoff');
  }

  removePlayerShoot(playerId: string): void {
    this.removeLatestPlayerPath(playerId, action => action === 'shoot');
  }

  selectAction(action: ActionType): void {
    const menu = this.contextMenu();
    if (!menu) return;
    if (this.isPlayFinalized()) {
      this.contextMenu.set(null);
      return;
    }
    const token = findPlayerToken(this.tokens, menu.playerId);
    const anchor = getCurrentAnchorPosition(this.tokens, this.currentPhasePaths, menu.playerId);
    if (!token || !anchor) { this.contextMenu.set(null); return; }
    this.clearPathEditing();
    this.contextMenu.set(null);

    if (action === 'shoot') {
      this.drawShootArc(token.id, anchor);
      this.ballCarrierId.set(null);
      this.updateBallIndicator();
      this.nextPhase();
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
    this.pushUndoSnapshot();
    this.currentPhasePaths.push({ ...storedPath, fabricObjects });
    this.currentPathCount.set(this.currentPhasePaths.length);
    this.markPhaseModified();

    this.ballCarrierId.set(receiverId);
    this.bringTokensToFront();
    this.updateBallIndicator();
  }

  private findLatestPlayerPath(
    playerId: string,
    predicate: (action: ActionType) => boolean,
  ): PhasePath | null {
    for (let index = this.currentPhasePaths.length - 1; index >= 0; index--) {
      const path = this.currentPhasePaths[index];
      if (path.ownerId !== playerId || !predicate(path.actionType)) continue;
      return path;
    }

    return null;
  }

  private removeLatestPlayerPath(playerId: string, predicate: (action: ActionType) => boolean): void {
    const targetPath = this.findLatestPlayerPath(playerId, predicate);
    this.contextMenu.set(null);
    if (!targetPath) return;
    const targetObject = targetPath.fabricObjects[0];
    if (!targetObject) return;
    this.eraseObject(targetObject);
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
    this.pushUndoSnapshot();
    this.currentPhasePaths.push({ ...storedPath, fabricObjects });
    this.currentPathCount.set(this.currentPhasePaths.length);
    this.markPhaseModified();
    this.bringTokensToFront();
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
    this.bringTokensToFront();
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

    this.pushUndoSnapshot();
    this.currentPhasePaths.push({ ...storedPath, fabricObjects });
    this.currentPathCount.set(this.currentPhasePaths.length);
    this.markPhaseModified();
    this.bringTokensToFront();
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

    this.pushUndoSnapshot();
    this.selectedPathObject = null;
    this.tokens = result.tokens;
    this.currentPhasePaths = result.currentPhasePaths;
    this.currentPathCount.set(this.currentPhasePaths.length);
    this.markPhaseModified();
    this.ballCarrierId.set(result.ballCarrierId);
    this.ballIndicator = result.ballIndicator;
    this.updatePathSelectedState();
    this.refreshShadowTokens();
    this.updateBallIndicator();
    this.fabricCanvas.renderAll();
  }

  clearAllPaths(): void {
    if (this.currentPhasePaths.length === 0) return;
    this.pushUndoSnapshot();
    this.markPhaseModified();
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

    if (this.editingPhaseIndex !== null && !this.editingPhaseModified) {
      // No changes made — restore to the pre-edit state and exit editing mode
      this.currentPhasePaths.forEach(p => p.fabricObjects.forEach(o => this.fabricCanvas.remove(o)));
      this.currentPhasePaths = [];
      this.currentPathCount.set(0);

      if (this.savedEditingState) {
        restoreSavedTokenPositions(this.tokens, this.savedEditingState.tokenPositions);
        this.ballCarrierId.set(this.savedEditingState.ballCarrierId);
        for (const path of this.savedEditingState.phasePaths) {
          this.redrawStoredPath(path);
        }
        this.savedEditingState = null;
      }

      this.editingPhaseIndex = null;
      this.clearUndoStack();
      this.currentPhaseIndex.set(this._phases.length);

      this.clearShadowTokens();
      this.refreshShadowTokens();
      this.syncCanvasInteractivity();
      this.updateBallIndicator();
      this.fabricCanvas.renderAll();
      return;
    }

    if (this.editingPhaseIndex !== null) {
      // Changes were made — drop this phase and everything after it before pushing the new version
      this._phases = this._phases.slice(0, this.editingPhaseIndex);
      this.editingPhaseIndex = null;
      this.editingPhaseModified = false;
      this.savedEditingState = null;
    }

    this.clearUndoStack();
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

    advanceTokensToPathEndpoints(this.tokens, this.currentPhasePaths);

    this.currentPhasePaths.forEach(p => p.fabricObjects.forEach(o => this.fabricCanvas.remove(o)));
    this.currentPhasePaths = [];
    this.currentPathCount.set(0);

    this.clearShadowTokens();
    this.syncCanvasInteractivity();
    this.updateBallIndicator();
    this.fabricCanvas.renderAll();
  }

  private pushUndoSnapshot(): void {
    this.undoStack.push({
      phasePaths: this.currentPhasePaths.map(p => ({
        ownerId: p.ownerId,
        actionType: p.actionType,
        points: p.points.map(pt => ({ ...pt })),
        targetId: p.targetId,
      })),
      tokens: this.tokens.map(t => ({ id: t.id, type: t.type, label: t.label, position: { ...t.position } })),
      ballCarrierId: this.ballCarrierId(),
      defenseCount: this.defenseCount,
    });
    if (this.undoStack.length > 50) this.undoStack.shift();
    this.undoStackSize.set(this.undoStack.length);
  }

  private clearUndoStack(): void {
    this.undoStack = [];
    this.undoStackSize.set(0);
  }

  undo(): void {
    if (this.undoStack.length === 0) return;
    const snapshot = this.undoStack.pop()!;
    this.undoStackSize.set(this.undoStack.length);

    this.clearPathEditing();
    this.clearShadowTokens();

    this.currentPhasePaths.forEach(p => p.fabricObjects.forEach(o => this.fabricCanvas.remove(o)));
    this.currentPhasePaths = [];
    this.currentPathCount.set(0);

    this.tokens.forEach(t => this.fabricCanvas.remove(t.fabricGroup));
    this.tokens = [];
    this.defenseCount = snapshot.defenseCount;

    for (const t of snapshot.tokens) {
      const group = this.createTokenGroup(t.type, t.label, t.position.x, t.position.y);
      this.tokens.push({ fabricGroup: group, id: t.id, type: t.type, label: t.label, position: { ...t.position } });
      this.fabricCanvas.add(group);
    }

    this.ballCarrierId.set(snapshot.ballCarrierId);

    for (const path of snapshot.phasePaths) {
      this.redrawStoredPath(path);
    }

    if (this.editingPhaseIndex !== null) this.editingPhaseModified = true;

    this.refreshShadowTokens();
    this.updateBallIndicator();
    this.syncCanvasInteractivity();
    this.fabricCanvas.renderAll();
  }

  onDeleteKey(): void {
    const targetObject = this.activePathEdit?.path.fabricObjects[0] ?? this.selectedPathObject;
    if (!targetObject) return;
    this.eraseObject(targetObject);
  }

  jumpToPhase(index: number): void {
    if (index >= this._phases.length) return;

    this.clearPathEditing();
    this.clearShadowTokens();

    // Save the pre-edit state only on first entry into editing mode
    if (this.editingPhaseIndex === null) {
      this.savedEditingState = {
        phasePaths: this.currentPhasePaths.map(p => ({
          ownerId: p.ownerId,
          actionType: p.actionType,
          points: p.points.map(pt => ({ ...pt })),
          targetId: p.targetId,
        })),
        tokenPositions: captureTokenPositions(this.tokens),
        ballCarrierId: this.ballCarrierId(),
      };
    }

    this.currentPhasePaths.forEach(p => p.fabricObjects.forEach(o => this.fabricCanvas.remove(o)));
    this.currentPhasePaths = [];
    this.currentPathCount.set(0);

    const phase = this._phases[index];

    for (const token of this.tokens) {
      const pos = phase.playerPositions[token.id];
      if (!pos) continue;
      token.position = { ...pos };
    }
    syncTokensToPhasePositions(this.tokens, phase.playerPositions);
    this.ballCarrierId.set(phase.ballCarrierId);

    for (const path of phase.paths) {
      this.redrawStoredPath(path);
    }

    this.editingPhaseIndex = index;
    this.editingPhaseModified = false;
    this.clearUndoStack();
    this.currentPhaseIndex.set(index);

    this.refreshShadowTokens();
    this.updateBallIndicator();
    this.syncCanvasInteractivity();
    this.fabricCanvas.renderAll();
  }

  private markPhaseModified(): void {
    if (this.editingPhaseIndex !== null) this.editingPhaseModified = true;
  }

  // ── Animation ─────────────────────────────────────────────────

  previewPlay(startPhaseIndex = 0, startPaused = false): Promise<void> {
    return this.animController.preview(startPhaseIndex, startPaused);
  }

  stopAnimation(): void {
    this.animController.stop();
  }

  togglePause(): void {
    this.animController.togglePause();
  }

  rollbackPhase(): void {
    this.animController.rollbackPhase();
  }

  // ── Save / Load ───────────────────────────────────────────────

  async save(): Promise<void> {
    if (this.saving()) return;
    this.clearPathEditing();
    this.saving.set(true);
    try {
      if (this.newCategoryName.trim()) await this.createCategory();
      const id = await this.saveController.persist({
        playId: this.playId(),
        name: this.playName(),
        extra: { team_id: this.teamId ?? undefined, opponent_id: this.oppId ?? undefined },
      });
      if (!this.playId()) {
        this.playId.set(id);
        this.router.navigate([...this.listPath, id], { replaceUrl: true });
      }
    } finally {
      this.saving.set(false);
    }
  }

  async duplicatePlay(): Promise<void> {
    if (this.duplicating()) return;
    this.clearPathEditing();
    this.duplicating.set(true);
    try {
      const newId = await this.saveController.persist({
        playId: null,
        name: `Copy of ${this.playName()}`,
        extra: { team_id: this.teamId ?? undefined, opponent_id: this.oppId ?? undefined },
      });
      this.router.navigate([...this.listPath, newId], { replaceUrl: false });
    } finally {
      this.duplicating.set(false);
    }
  }

  async saveAsTemplate(): Promise<void> {
    if (this.savingTemplate()) return;
    this.clearPathEditing();
    this.savingTemplate.set(true);
    try {
      await this.saveController.persist({
        playId: null,
        name: this.playName(),
        extra: { is_template: true },
      });
    } finally {
      this.savingTemplate.set(false);
    }
  }

  private async loadPlay(): Promise<void> {
    const play = await this.playService.get(this.playId()!);
    if (!play) return;
    this.playName.set(play.name);
    this.playDesc.set(play.description ?? '');
    this.playCat.set(play.category_id);

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

    if (this._phases.length > 0) this.jumpToPhase(0);
  }

  loadFromAiPlay(aiState: PlayEditorState): void {
    this.stopAnimation();
    this.clearPathEditing();
    this.fabricCanvas.clear();
    this.wipeState();
    this.applyCanvasLayout(aiState.courtMode as 'half' | 'full');
    this.courtMode.set(aiState.courtMode as 'half' | 'full');
    drawCourt(this.fabricCanvas, aiState.courtMode as 'half' | 'full');
    this.attachCanvasEvents();

    for (const token of aiState.tokens) {
      this.spawnToken(
        token.id,
        token.type as 'offense' | 'defense',
        token.label,
        token.position.x,
        token.position.y,
      );
    }

    this._phases = aiState.phases as Phase[];
    this.phaseCount.set(this._phases.length);
    this.ballCarrierId.set(aiState.ballCarrierId);
    this.currentPhaseIndex.set(aiState.currentPhaseIndex);

    for (const path of aiState.currentPhasePaths) {
      this.redrawStoredPath(path as StoredPath);
    }

    this.refreshShadowTokens();
    this.updateBallIndicator();

    if (this._phases.length > 0) this.jumpToPhase(0);
  }

  private redrawStoredPath(p: StoredPath): void {
    const fabricObjects = renderActionPathObjects({
      canvas: this.fabricCanvas,
      actionType: p.actionType,
      points: p.points,
      style: PATH_STYLES[p.actionType],
      evented: true,
    });
    this.currentPhasePaths.push({
      ownerId: p.ownerId,
      actionType: p.actionType,
      points: p.points,
      targetId: p.targetId,
      fabricObjects,
    });
    this.currentPathCount.set(this.currentPhasePaths.length);
    this.bringTokensToFront();
  }

  // ── Export: Video ─────────────────────────────────────────────

  exportVideo(): void {
    if (this._phases.length === 0) { alert('No phases recorded yet.'); return; }
    exportPlayEditorVideo({
      canvasElement: this.canvasRef().nativeElement as HTMLCanvasElement,
      phases: this._phases,
      downloadFilename: toDownloadFilename(this.playName(), 'webm'),
      isPlaying: () => this.isPlaying(),
      animatePhase: phase => this.animController.animatePhase(phase),
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

  // ── Categories ────────────────────────────────────────────────

  private async loadCategories(): Promise<void> {
    if (this.teamId === null) return;
    this.categories.set(await this.playService.listCategories(this.teamId));
  }

  async createCategory(): Promise<void> {
    const name = this.newCategoryName.trim();
    if (!name || this.teamId === null) return;
    const id = await this.playService.saveCategory({ name, team_id: this.teamId });
    this.newCategoryName = '';
    await this.loadCategories();
    this.playCat.set(id);
  }

  setCategoryId(value: string): void {
    this.playCat.set(value ? value : undefined);
  }

  back(): void { this.router.navigate(this.listPath); }
}
