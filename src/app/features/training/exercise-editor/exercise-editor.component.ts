import {
  Component, ElementRef, OnDestroy,
  afterNextRender, computed, inject, signal, viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Canvas, Circle, Group, FabricText, Path, FabricObject, Triangle,
} from 'fabric';
import {
  COURT_OUT_OF_BOUNDS_PADDING,
  drawCourt,
  courtCanvasSize,
  courtSize,
  CourtMode,
} from '../../playbook/play-editor/court-painter';
import { TrainingSessionService } from '../../../core/services/training-session.service';
import { Drill } from '../../../shared/models/models';
import {
  BALL_INDICATOR_RADIUS,
  PATH_STYLES,
  TOKEN_RADIUS,
} from '../../playbook/play-editor/play-editor.constants';
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
} from '../../playbook/play-editor/play-editor.models';
import {
  buildPhasePathSchedule as createPhasePathSchedule,
  getCarrierBallIndicatorState as resolveCarrierBallIndicatorState,
  getPlayerPositionAtTime as resolvePlayerPositionAtTime,
  getRemainingPathPoints as resolveRemainingPathPoints,
  getScheduledPathCoverage as resolveScheduledPathCoverage,
  isMovementAction as isMovementPathAction,
} from '../../playbook/play-editor/play-editor-path.utils';
import { renderActionPathObjects } from '../../playbook/play-editor/play-editor-fabric.utils';
import {
  ensureEditableMovementPoints,
  findPlayerToken,
  getCurrentAnchorPosition,
  isEditableMovementPath,
} from '../../playbook/play-editor/play-editor-editing.utils';
import {
  advanceTokensToPathEndpoints,
  captureTokenPositions,
  restoreSavedTokenPositions,
  SavedTokenPosition,
  syncTokensToPhasePositions,
  syncTokensToResolvedPositions,
  syncTokensToStoredPositions,
} from '../../playbook/play-editor/play-editor-token-position.utils';
import {
  applyActivePathControlEdit as applyFabricActivePathControlEdit,
  applyShadowEndpointEdit as applyFabricShadowEndpointEdit,
  clearShadowTokens as clearFabricShadowTokens,
  createPathControlHandle as createFabricPathControlHandle,
  rebuildEditablePath as rebuildFabricEditablePath,
  removeTaggedPathHandles as removeFabricTaggedPathHandles,
  refreshShadowTokens as refreshFabricShadowTokens,
  syncDraggedShadowPlaceholder as syncFabricDraggedShadowPlaceholder,
} from '../../playbook/play-editor/play-editor-fabric-editing.utils';
import {
  appendDrawPoint,
  buildDrawnMovementStoredPath,
  buildPassStoredPath,
  buildShootStoredPath,
} from '../../playbook/play-editor/play-editor-action-path.utils';
import { bindExerciseEditorCanvasEvents } from './exercise-editor-canvas-events.utils';
import {
  buildExerciseCanvasStateSnapshot,
  parseExerciseCanvasState,
} from './exercise-editor-persistence.utils';
import { ExerciseToken, ExerciseTokenType, ExercisePhase } from './exercise-editor.models';

interface ExerciseUndoSnapshot {
  phasePaths: StoredPath[];
  tokens: Array<{ id: string; type: ExerciseTokenType; label: string; position: Point }>;
  ballCarrierIds: string[];
  offenseCount: number;
  defenseCount: number;
  coachCount: number;
}

@Component({
  selector: 'app-exercise-editor',
  imports: [FormsModule],
  templateUrl: './exercise-editor.component.html',
  styleUrl: './exercise-editor.component.scss',
  host: {
    '(document:keydown.escape)': 'onEscape()',
    '(document:keydown.delete)': 'onDeleteKey()',
    '(document:keydown.backspace)': 'onDeleteKey()',
    '(document:keydown.control.z)': 'undo()',
    '(document:pointerdown)': 'onDocumentPointerDown($event)',
  },
})
export class ExerciseEditorComponent implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly trainingService = inject(TrainingSessionService);
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('courtCanvas');
  private fabricCanvas!: Canvas;

  // ── Route params ───────────────────────────────────────────────
  private readonly teamId: string | null = ExerciseEditorComponent.parseId(
    this.route.snapshot.paramMap.get('teamId'));
  private readonly sessionId: string | null = ExerciseEditorComponent.parseId(
    this.route.snapshot.paramMap.get('sessionId'));
  private readonly drillId: string | null =
    this.route.snapshot.paramMap.get('drillId');

  private static parseId(raw: string | null): string | null {
    return raw ?? null;
  }

  // ── Reactive signals ──────────────────────────────────────────
  readonly drillName    = signal('Exercise');
  readonly courtMode    = signal<CourtMode>('half');
  readonly activeTool   = signal<Tool>('select');
  readonly animState    = signal<AnimState>('idle');
  readonly animSpeed    = signal(1);
  readonly animProgress = signal(0);
  readonly showAnimatedLines = signal(true);
  readonly saving       = signal(false);

  readonly ballCarrierIds  = signal<string[]>([]);
  readonly contextMenu     = signal<ContextMenuState | null>(null);
  readonly pendingAction   = signal<ActionType | null>(null);
  readonly currentPathCount  = signal(0);
  readonly phaseCount        = signal(0);
  readonly currentPhaseIndex = signal(0);
  readonly pendingPassFrom   = signal<string | null>(null);
  readonly pathSelected      = signal(false);

  readonly isPlaying   = computed(() => this.animState() === 'playing');
  readonly isPaused    = computed(() => this.animState() === 'paused');
  readonly isAnimating = computed(() => this.animState() !== 'idle');
  readonly canPreview  = computed(() => this.phaseCount() > 0);

  private readonly undoStackSize = signal(0);
  readonly canUndo = computed(() => this.undoStackSize() > 0);

  readonly categories: Array<'offense' | 'defense' | 'transition' | 'inbound' | 'press-break'> = [
    'offense', 'defense', 'transition', 'inbound', 'press-break',
  ];

  // ── Internal canvas state ─────────────────────────────────────
  private tokens: ExerciseToken[] = [];
  private shadowTokens: ShadowToken[] = [];
  private currentPhasePaths: PhasePath[] = [];
  private _phases: ExercisePhase[] = [];
  private offenseCount = 0;
  private defenseCount = 0;
  private coachCount   = 0;
  private isDrawing = false;
  private currentPathPoints: Point[] = [];
  private livePathObj: Path | null = null;
  private pendingDrawStart: Point | null = null;
  private activeOwnerId: string | null = null;
  private activePathEdit: PathEditState | null = null;
  private selectedPathObject: FabricObject | null = null;
  private mouseDownPoint: Point | null = null;
  private animFrameId: number | null = null;
  private ballIndicators: Circle[] = [];
  private animatedPhaseObjects: FabricObject[] = [];
  private readonly ANIM_DURATION = 2500;
  private activeAnimResolve: (() => void) | null = null;

  private animTick: FrameRequestCallback | null = null;
  private animElapsed = 0;
  private animLastNow: number | null = null;
  private animDuration = 0;
  private animPhaseIndex = 0;
  private animPhase: ExercisePhase | null = null;
  private animScheduledPaths: ScheduledPath[] = [];
  private pendingRestartPhase: number | null = null;

  private undoStack: ExerciseUndoSnapshot[] = [];
  private editingPhaseIndex: number | null = null;
  private editingPhaseModified = false;
  private savedEditingState: {
    phasePaths: StoredPath[];
    tokenPositions: SavedTokenPosition[];
    ballCarrierIds: string[];
  } | null = null;

  get phases(): ExercisePhase[] { return this._phases; }

  constructor() {
    afterNextRender(() => {
      this.initCanvas();
      if (this.sessionId && this.drillId) {
        this.loadExercise();
      }
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
      1, 0, 0, 1,
      COURT_OUT_OF_BOUNDS_PADDING,
      COURT_OUT_OF_BOUNDS_PADDING,
    ] as [number, number, number, number, number, number]);
  }

  private attachCanvasEvents(): void {
    bindExerciseEditorCanvasEvents({
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
      setPendingPassFrom: id => { this.pendingPassFrom.set(id); },
      getBallCarrierIds: () => this.ballCarrierIds(),
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
      applyShadowEndpointEdit: (shadow, preserve) => this.applyShadowEndpointEdit(shadow, preserve),
      updateBallIndicator: () => this.updateBallIndicators(),
    });
  }

  switchCourtMode(mode: CourtMode): void {
    if (mode === this.courtMode()) return;
    if (this.tokens.length > 0 && !confirm('Switching court view will reset the exercise. Continue?')) return;
    this.courtMode.set(mode);
    this.stopAnimation();
    this.wipeState();
    this.fabricCanvas.clear();
    this.applyCanvasLayout(mode);
    drawCourt(this.fabricCanvas, mode);
    this.attachCanvasEvents();
  }

  private wipeState(): void {
    this.clearPathEditing();
    this.tokens = [];
    this.shadowTokens = [];
    this.currentPhasePaths = [];
    this._phases = [];
    this.offenseCount = 0;
    this.defenseCount = 0;
    this.coachCount = 0;
    this.ballCarrierIds.set([]);
    this.ballIndicators = [];
    this.currentPhaseIndex.set(0);
    this.currentPathCount.set(0);
    this.phaseCount.set(0);
    this.pendingPassFrom.set(null);
    this.editingPhaseIndex = null;
    this.editingPhaseModified = false;
    this.savedEditingState = null;
    this.clearUndoStack();
  }

  // ── Tool selection ────────────────────────────────────────────

  setTool(tool: Tool): void {
    this.activeTool.set(tool);
    this.fabricCanvas.selection = false;
    if (tool !== 'draw-path') {
      this.pendingAction.set(null);
      this.pendingDrawStart = null;
      this.activeOwnerId = null;
    }
    this.syncCanvasInteractivity();
    this.fabricCanvas.renderAll();
  }

  private syncCanvasInteractivity(): void {
    const tool = this.activeTool();
    const shadowGroups = new Set(this.shadowTokens.map(s => s.fabricGroup));
    const editablePathObjects = new Set<FabricObject>();
    for (const path of this.currentPhasePaths) {
      if (!isEditableMovementPath(this.currentPhasePaths, path)) continue;
      const mainPath = path.fabricObjects[0];
      if (mainPath) editablePathObjects.add(mainPath);
    }

    this.fabricCanvas.forEachObject(o => {
      const token = this.tokens.find(t => t.fabricGroup === o);
      const isShadow = shadowGroups.has(o as Group);
      const isPathObject = editablePathObjects.has(o);
      const isEditHandle = this.activePathEdit?.controlHandle === o;

      o.selectable = tool === 'select' && (!!token || isShadow || isEditHandle);
      o.evented = tool === 'erase'
        ? !isShadow && !isEditHandle
        : tool === 'select'
          ? !!token || isShadow || isPathObject || isEditHandle
          : false;
    });
  }

  // ── Token spawning ────────────────────────────────────────────

  addOffensePlayer(): void {
    this.pushUndoSnapshot();
    const { W, H } = courtSize(this.courtMode());
    this.offenseCount++;
    this.spawnToken(
      `offense-${Date.now()}`, 'offense',
      String(this.offenseCount),
      Math.round(W * 0.5), Math.round(H * 0.55),
    );
  }

  addDefensePlayer(): void {
    this.pushUndoSnapshot();
    const { W, H } = courtSize(this.courtMode());
    this.defenseCount++;
    this.spawnToken(
      `defense-${Date.now()}`, 'defense', 'X',
      Math.round(W * 0.45), Math.round(H * 0.45),
    );
  }

  addCoachPlayer(): void {
    this.pushUndoSnapshot();
    const { W, H } = courtSize(this.courtMode());
    this.coachCount++;
    const label = this.coachCount === 1 ? 'C' : `C${this.coachCount}`;
    this.spawnToken(
      `coach-${Date.now()}`, 'coach', label,
      Math.round(W * 0.1), Math.round(H * 0.5),
    );
  }

  addCone(): void {
    this.pushUndoSnapshot();
    const { W, H } = courtSize(this.courtMode());
    this.spawnToken(
      `cone-${Date.now()}`, 'cone', '',
      Math.round(W * 0.5), Math.round(H * 0.35),
    );
  }

  private spawnToken(id: string, type: ExerciseTokenType, label: string, x: number, y: number): void {
    const group = this.createTokenGroup(type, label, x, y);
    this.tokens.push({ fabricGroup: group, id, type, label, position: { x, y } });
    this.fabricCanvas.add(group);
    this.syncCanvasInteractivity();
    this.fabricCanvas.renderAll();
  }

  createTokenGroup(
    type: ExerciseTokenType | 'offense' | 'defense',
    label: string,
    x: number,
    y: number,
    isShadow = false,
  ): Group {
    if (type === 'cone') {
      const CONE = TOKEN_RADIUS * 1.1;
      const tri = new Triangle({
        width: CONE * 2, height: CONE * 2,
        fill: '#f97316', stroke: '#7c2d12', strokeWidth: 1.5,
        originX: 'center', originY: 'center',
      });
      return new Group([tri], {
        left: x, top: y,
        selectable: this.activeTool() === 'select',
        evented: this.activeTool() === 'select',
        hasControls: false, hasBorders: false,
        hoverCursor: 'pointer',
      });
    }

    const colors: Record<string, { fill: string; fillShadow: string; stroke: string; strokeShadow: string; text: string }> = {
      offense: {
        fill: '#1e3a5f', fillShadow: 'rgba(30,64,175,0.35)',
        stroke: '#60a5fa', strokeShadow: '#1d4ed8',
        text: '#60a5fa',
      },
      defense: {
        fill: '#2d1f3f', fillShadow: 'rgba(109,40,217,0.35)',
        stroke: '#c084fc', strokeShadow: '#7c3aed',
        text: '#c084fc',
      },
      coach: {
        fill: '#78350f', fillShadow: 'rgba(120,53,15,0.35)',
        stroke: '#f59e0b', strokeShadow: '#d97706',
        text: '#fbbf24',
      },
    };

    const c = colors[type as string] ?? colors['offense'];
    const circle = new Circle({
      radius: TOKEN_RADIUS,
      fill: isShadow ? c.fillShadow : c.fill,
      stroke: isShadow ? c.strokeShadow : c.stroke,
      strokeWidth: isShadow ? 2.5 : 2,
      strokeDashArray: isShadow ? [7, 5] : undefined,
      opacity: isShadow ? 0.9 : 1,
      originX: 'center', originY: 'center',
    });
    const text = new FabricText(label, {
      fontSize: 13, fontWeight: 'bold',
      fill: isShadow ? '#ffffff' : c.text,
      opacity: isShadow ? 0.9 : 1,
      originX: 'center', originY: 'center',
      fontFamily: 'Inter, system-ui, sans-serif',
    });
    return new Group([circle, text], {
      left: x, top: y,
      selectable: this.activeTool() === 'select' && !isShadow,
      evented: this.activeTool() === 'select',
      hasControls: false, hasBorders: false,
      hoverCursor: 'pointer',
    });
  }

  // ── Ball carrier management ───────────────────────────────────

  toggleBallCarrier(playerId: string): void {
    this.ballCarrierIds.update(ids =>
      ids.includes(playerId) ? ids.filter(id => id !== playerId) : [...ids, playerId],
    );
    this.contextMenu.set(null);
    this.updateBallIndicators();
  }

  private updateBallIndicators(): void {
    this.ballIndicators.forEach(ind => this.fabricCanvas.remove(ind));
    this.ballIndicators = [];

    for (const carrierId of this.ballCarrierIds()) {
      const carrier = this.tokens.find(t => t.id === carrierId && t.type !== 'cone');
      if (!carrier) continue;
      const anchor = getCurrentAnchorPosition(
        this.tokens as unknown as PlayerToken[],
        this.currentPhasePaths,
        carrierId,
      ) ?? carrier.position;
      const placement = resolveCarrierBallIndicatorState(anchor);
      const indicator = new Circle({
        radius: BALL_INDICATOR_RADIUS, fill: '#f97316', stroke: '#7c2d12', strokeWidth: 1.5,
        left: placement.left ?? 0, top: placement.top ?? 0,
        selectable: false, evented: false,
      });
      this.fabricCanvas.add(indicator);
      this.ballIndicators.push(indicator);
    }
    this.fabricCanvas.renderAll();
  }

  private placeBallIndicatorsAt(
    carrierIds: string[],
    positionFn: (id: string) => Point | null,
  ): void {
    this.ballIndicators.forEach(ind => this.fabricCanvas.remove(ind));
    this.ballIndicators = [];

    for (const carrierId of carrierIds) {
      const pos = positionFn(carrierId);
      if (!pos) continue;
      const placement = resolveCarrierBallIndicatorState(pos);
      const indicator = new Circle({
        radius: BALL_INDICATOR_RADIUS, fill: '#f97316', stroke: '#7c2d12', strokeWidth: 1.5,
        left: placement.left ?? 0, top: placement.top ?? 0,
        selectable: false, evented: false,
      });
      this.fabricCanvas.add(indicator);
      this.ballIndicators.push(indicator);
    }
  }

  private ensureBallIndicators(): void {
    // Only ensure they're present — full rebuild via updateBallIndicators
    if (this.ballIndicators.length < this.ballCarrierIds().length) {
      this.updateBallIndicators();
    }
  }

  private bringBallIndicatorsToFront(): void {
    this.ballIndicators.forEach(ind => {
      this.fabricCanvas.remove(ind);
      this.fabricCanvas.add(ind);
    });
  }

  private bringTokensToFront(): void {
    for (const token of this.tokens) {
      this.fabricCanvas.bringObjectToFront(token.fabricGroup);
    }
    for (const shadow of this.shadowTokens) {
      this.fabricCanvas.bringObjectToFront(shadow.fabricGroup);
    }
    this.bringBallIndicatorsToFront();
  }

  // ── Path editing (delegated to play-editor utils) ─────────────

  private isPathEditHandle(target?: FabricObject): boolean {
    return !!target && (target as FabricObject & { __pathEditHandle?: boolean }).__pathEditHandle === true;
  }

  private isMovementAction(action: ActionType): boolean {
    return isMovementPathAction(action);
  }

  private getGroupCenter(group: Group): Point {
    return { x: group.left ?? 0, y: group.top ?? 0 };
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

  private clearPathEditing(): void {
    if (!this.fabricCanvas) return;
    removeFabricTaggedPathHandles(this.fabricCanvas, target => this.isPathEditHandle(target));
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
    const controlHandle = createFabricPathControlHandle(path);
    removeFabricTaggedPathHandles(this.fabricCanvas, target => this.isPathEditHandle(target));
    this.fabricCanvas.add(controlHandle);
    this.activePathEdit = { path, controlHandle };
    this.selectedPathObject = null;
    this.updatePathSelectedState();
    controlHandle.setCoords();
    if (refreshShadow) this.refreshShadowTokens();
    this.syncCanvasInteractivity();
    this.fabricCanvas.renderAll();
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
      () => this.updateBallIndicators(),
      () => removeFabricTaggedPathHandles(this.fabricCanvas, target => this.isPathEditHandle(target)),
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
      () => this.updateBallIndicators(),
      () => removeFabricTaggedPathHandles(this.fabricCanvas, target => this.isPathEditHandle(target)),
      false,
    );
  }

  private applyShadowEndpointEdit(shadow: ShadowToken, preservePlaceholder = false): void {
    applyFabricShadowEndpointEdit({
      fabricCanvas: this.fabricCanvas,
      tokens: this.tokens as unknown as PlayerToken[],
      currentPhasePaths: this.currentPhasePaths,
      shadow,
      activePathEdit: this.activePathEdit,
      preservePlaceholder,
      rebuildEditablePath: path => this.rebuildEditablePath(path),
      beginPathEditing: (path, refreshShadow) => this.beginPathEditing(path, refreshShadow),
      refreshShadowTokens: () => this.refreshShadowTokens(),
      syncDraggedShadowPlaceholder: (candidate, end) => this.syncDraggedShadowPlaceholder(candidate, end),
      updateBallIndicator: () => this.updateBallIndicators(),
    });
  }

  private syncDraggedShadowPlaceholder(shadow: ShadowToken, end: Point): void {
    this.shadowTokens = syncFabricDraggedShadowPlaceholder({
      fabricCanvas: this.fabricCanvas,
      tokens: this.tokens as unknown as PlayerToken[],
      shadowTokens: this.shadowTokens,
      shadow,
      end,
      syncCanvasInteractivity: () => this.syncCanvasInteractivity(),
    });
  }

  private refreshShadowTokens(): void {
    this.shadowTokens = refreshFabricShadowTokens({
      fabricCanvas: this.fabricCanvas,
      tokens: this.tokens as unknown as PlayerToken[],
      currentPhasePaths: this.currentPhasePaths,
      shadowTokens: this.shadowTokens,
      activePathEdit: this.activePathEdit,
      createTokenGroup: (type, label, x, y, isShadow) =>
        this.createTokenGroup(type as ExerciseTokenType, label, x, y, isShadow),
      clearPathEditing: () => this.clearPathEditing(),
      syncCanvasInteractivity: () => this.syncCanvasInteractivity(),
    });
  }

  // ── Context menu ──────────────────────────────────────────────

  closeContextMenu(): void { this.contextMenu.set(null); }

  selectAction(action: ActionType): void {
    const menu = this.contextMenu();
    if (!menu) return;
    const token = findPlayerToken(this.tokens as unknown as PlayerToken[], menu.playerId);
    const anchor = getCurrentAnchorPosition(
      this.tokens as unknown as PlayerToken[],
      this.currentPhasePaths,
      menu.playerId,
    );
    if (!token || !anchor) { this.contextMenu.set(null); return; }
    this.clearPathEditing();
    this.contextMenu.set(null);

    if (action === 'shoot') {
      this.drawShootArc(token.id, anchor);
      this.ballCarrierIds.update(ids => ids.filter(id => id !== token.id));
      this.updateBallIndicators();
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

    const from = getCurrentAnchorPosition(
      this.tokens as unknown as PlayerToken[], this.currentPhasePaths, passerId,
    ) ?? passer.position;
    const to = getCurrentAnchorPosition(
      this.tokens as unknown as PlayerToken[], this.currentPhasePaths, receiverId,
    ) ?? receiver.position;

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

    // Transfer ball: passer loses ball, receiver gains it
    this.ballCarrierIds.update(ids => {
      const next = ids.filter(id => id !== passerId);
      if (!next.includes(receiverId)) next.push(receiverId);
      return next;
    });
    this.bringTokensToFront();
    this.updateBallIndicators();
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

  canRemovePlayerPass(playerId: string): boolean {
    return this.findLatestPlayerPath(playerId, a => a === 'pass' || a === 'dribble-handoff') !== null;
  }

  canRemovePlayerShoot(playerId: string): boolean {
    return this.findLatestPlayerPath(playerId, a => a === 'shoot') !== null;
  }

  removePlayerPass(playerId: string): void {
    this.removeLatestPlayerPath(playerId, a => a === 'pass' || a === 'dribble-handoff');
  }

  removePlayerShoot(playerId: string): void {
    this.removeLatestPlayerPath(playerId, a => a === 'shoot');
  }

  private findLatestPlayerPath(
    playerId: string,
    predicate: (action: ActionType) => boolean,
  ): PhasePath | null {
    for (let i = this.currentPhasePaths.length - 1; i >= 0; i--) {
      const path = this.currentPhasePaths[i];
      if (path.ownerId === playerId && predicate(path.actionType)) return path;
    }
    return null;
  }

  private removeLatestPlayerPath(playerId: string, predicate: (action: ActionType) => boolean): void {
    const target = this.findLatestPlayerPath(playerId, predicate);
    this.contextMenu.set(null);
    if (!target) return;
    const obj = target.fabricObjects[0];
    if (obj) this.eraseObject(obj);
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

    if (!storedPath) { this.setTool('select'); return; }

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
    this.updateBallIndicators();
    this.setTool('select');
  }

  // ── Erase ─────────────────────────────────────────────────────

  private eraseObject(obj: FabricObject): void {
    // Erase token
    const tokenIndex = this.tokens.findIndex(t => t.fabricGroup === obj);
    if (tokenIndex !== -1) {
      const token = this.tokens[tokenIndex];
      if (this.activePathEdit?.path.ownerId === token.id) this.clearPathEditing();

      const ownedPaths = this.currentPhasePaths.filter(p => p.ownerId === token.id);
      ownedPaths.forEach(p => p.fabricObjects.forEach(o => this.fabricCanvas.remove(o)));
      this.currentPhasePaths = this.currentPhasePaths.filter(p => p.ownerId !== token.id);

      this.fabricCanvas.remove(obj);
      this.tokens.splice(tokenIndex, 1);

      this.ballCarrierIds.update(ids => ids.filter(id => id !== token.id));
      this.currentPathCount.set(this.currentPhasePaths.length);
      this.selectedPathObject = null;
      this.updatePathSelectedState();
      this.markPhaseModified();
      this.refreshShadowTokens();
      this.updateBallIndicators();
      this.fabricCanvas.renderAll();
      return;
    }

    // Erase path — use the existing path-cascade logic
    const pathIndex = this.currentPhasePaths.findIndex(path => path.fabricObjects.includes(obj));
    if (pathIndex !== -1) {
      const removedIndexes = new Set<number>([pathIndex]);
      const basePath = this.currentPhasePaths[pathIndex];

      // Cascade ball-dependent paths after a pass/handoff
      if ((basePath.actionType === 'pass' || basePath.actionType === 'dribble-handoff') && basePath.targetId) {
        const pending = new Set<string>([basePath.targetId]);
        for (let i = pathIndex + 1; i < this.currentPhasePaths.length; i++) {
          if (removedIndexes.has(i)) continue;
          const c = this.currentPhasePaths[i];
          if (!pending.has(c.ownerId)) continue;
          if (c.actionType !== 'pass' && c.actionType !== 'dribble-handoff' && c.actionType !== 'shoot') continue;
          removedIndexes.add(i);
          if ((c.actionType === 'pass' || c.actionType === 'dribble-handoff') && c.targetId) pending.add(c.targetId);
        }
      }

      if (this.activePathEdit && removedIndexes.has(this.currentPhasePaths.indexOf(this.activePathEdit.path))) {
        this.clearPathEditing();
      }

      const nextPaths: PhasePath[] = [];
      for (let i = 0; i < this.currentPhasePaths.length; i++) {
        const path = this.currentPhasePaths[i];
        if (removedIndexes.has(i)) {
          path.fabricObjects.forEach(o => this.fabricCanvas.remove(o));
          continue;
        }
        nextPaths.push(path);
      }
      this.currentPhasePaths = nextPaths;

      // Restore passer as ball carrier if pass was removed
      if (basePath.actionType === 'pass' || basePath.actionType === 'dribble-handoff') {
        this.ballCarrierIds.update(ids => {
          const next = [...ids];
          if (!next.includes(basePath.ownerId)) next.push(basePath.ownerId);
          return next.filter(id => id !== basePath.targetId || ids.includes(id));
        });
      }

      this.currentPathCount.set(this.currentPhasePaths.length);
      this.markPhaseModified();
      this.selectedPathObject = null;
      this.updatePathSelectedState();
      this.refreshShadowTokens();
      this.updateBallIndicators();
      this.fabricCanvas.renderAll();
    }
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
    this.updateBallIndicators();
    this.fabricCanvas.renderAll();
  }

  onDeleteKey(): void {
    const targetObject = this.activePathEdit?.path.fabricObjects[0] ?? this.selectedPathObject;
    if (!targetObject) return;
    this.eraseObject(targetObject);
  }

  // ── Phase management ──────────────────────────────────────────

  nextPhase(): void {
    if (this.currentPhasePaths.length === 0) return;
    this.clearPathEditing();

    if (this.editingPhaseIndex !== null && !this.editingPhaseModified) {
      this.currentPhasePaths.forEach(p => p.fabricObjects.forEach(o => this.fabricCanvas.remove(o)));
      this.currentPhasePaths = [];
      this.currentPathCount.set(0);

      if (this.savedEditingState) {
        restoreSavedTokenPositions(this.tokens as unknown as PlayerToken[], this.savedEditingState.tokenPositions);
        this.ballCarrierIds.set(this.savedEditingState.ballCarrierIds);
        for (const path of this.savedEditingState.phasePaths) this.redrawStoredPath(path);
        this.savedEditingState = null;
      }

      this.editingPhaseIndex = null;
      this.clearUndoStack();
      this.currentPhaseIndex.set(this._phases.length);
      this.clearShadowTokens();
      this.refreshShadowTokens();
      this.syncCanvasInteractivity();
      this.updateBallIndicators();
      this.fabricCanvas.renderAll();
      return;
    }

    if (this.editingPhaseIndex !== null) {
      this._phases = this._phases.slice(0, this.editingPhaseIndex);
      this.editingPhaseIndex = null;
      this.editingPhaseModified = false;
      this.savedEditingState = null;
    }

    this.clearUndoStack();
    this._phases.push({
      playerPositions: Object.fromEntries(this.tokens.map(t => [t.id, { ...t.position }])),
      ballCarrierIds: [...this.ballCarrierIds()],
      paths: this.currentPhasePaths.map(p => ({
        ownerId: p.ownerId,
        actionType: p.actionType,
        points: p.points.map(pt => ({ ...pt })),
        targetId: p.targetId,
      })),
    });
    this.phaseCount.set(this._phases.length);
    this.currentPhaseIndex.set(this._phases.length);

    advanceTokensToPathEndpoints(this.tokens as unknown as PlayerToken[], this.currentPhasePaths);

    this.currentPhasePaths.forEach(p => p.fabricObjects.forEach(o => this.fabricCanvas.remove(o)));
    this.currentPhasePaths = [];
    this.currentPathCount.set(0);

    this.clearShadowTokens();
    this.syncCanvasInteractivity();
    this.updateBallIndicators();
    this.fabricCanvas.renderAll();
  }

  jumpToPhase(index: number): void {
    if (index >= this._phases.length) return;

    this.clearPathEditing();
    this.clearShadowTokens();

    if (this.editingPhaseIndex === null) {
      this.savedEditingState = {
        phasePaths: this.currentPhasePaths.map(p => ({
          ownerId: p.ownerId, actionType: p.actionType,
          points: p.points.map(pt => ({ ...pt })), targetId: p.targetId,
        })),
        tokenPositions: captureTokenPositions(this.tokens as unknown as PlayerToken[]),
        ballCarrierIds: [...this.ballCarrierIds()],
      };
    }

    this.currentPhasePaths.forEach(p => p.fabricObjects.forEach(o => this.fabricCanvas.remove(o)));
    this.currentPhasePaths = [];
    this.currentPathCount.set(0);

    const phase = this._phases[index];
    syncTokensToPhasePositions(this.tokens as unknown as PlayerToken[], phase.playerPositions);
    this.ballCarrierIds.set([...phase.ballCarrierIds]);

    for (const path of phase.paths) this.redrawStoredPath(path);

    this.editingPhaseIndex = index;
    this.editingPhaseModified = false;
    this.clearUndoStack();
    this.currentPhaseIndex.set(index);

    this.refreshShadowTokens();
    this.updateBallIndicators();
    this.syncCanvasInteractivity();
    this.fabricCanvas.renderAll();
  }

  private markPhaseModified(): void {
    if (this.editingPhaseIndex !== null) this.editingPhaseModified = true;
  }

  private clearShadowTokens(): void {
    this.shadowTokens = clearFabricShadowTokens(this.fabricCanvas, this.shadowTokens);
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
      ownerId: p.ownerId, actionType: p.actionType,
      points: p.points, targetId: p.targetId,
      fabricObjects,
    });
    this.currentPathCount.set(this.currentPhasePaths.length);
    this.bringTokensToFront();
  }

  // ── Undo ──────────────────────────────────────────────────────

  private pushUndoSnapshot(): void {
    this.undoStack.push({
      phasePaths: this.currentPhasePaths.map(p => ({
        ownerId: p.ownerId, actionType: p.actionType,
        points: p.points.map(pt => ({ ...pt })), targetId: p.targetId,
      })),
      tokens: this.tokens.map(t => ({
        id: t.id, type: t.type, label: t.label, position: { ...t.position },
      })),
      ballCarrierIds: [...this.ballCarrierIds()],
      offenseCount: this.offenseCount,
      defenseCount: this.defenseCount,
      coachCount: this.coachCount,
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
    this.offenseCount = snapshot.offenseCount;
    this.defenseCount = snapshot.defenseCount;
    this.coachCount = snapshot.coachCount;

    for (const t of snapshot.tokens) {
      const group = this.createTokenGroup(t.type, t.label, t.position.x, t.position.y);
      this.tokens.push({ fabricGroup: group, id: t.id, type: t.type, label: t.label, position: { ...t.position } });
      this.fabricCanvas.add(group);
    }

    this.ballCarrierIds.set([...snapshot.ballCarrierIds]);

    for (const path of snapshot.phasePaths) this.redrawStoredPath(path);

    if (this.editingPhaseIndex !== null) this.editingPhaseModified = true;

    this.refreshShadowTokens();
    this.updateBallIndicators();
    this.syncCanvasInteractivity();
    this.fabricCanvas.renderAll();
  }

  // ── Animation ─────────────────────────────────────────────────

  async previewPlay(startPhaseIndex = 0, startPaused = false): Promise<void> {
    if (this._phases.length === 0) return;
    this.clearPathEditing();
    this.clearAnimatedPhaseObjects();
    this.ensureBallIndicators();

    const savedPositions = captureTokenPositions(this.tokens as unknown as PlayerToken[]);
    const savedCarrierIds = [...this.ballCarrierIds()];

    this.currentPhasePaths.forEach(p => p.fabricObjects.forEach(o => o.set({ visible: false })));
    this.clearShadowTokens();

    const startPhase = this._phases[startPhaseIndex];
    syncTokensToPhasePositions(this.tokens as unknown as PlayerToken[], startPhase.playerPositions);
    this.animPositionBallsAtPhaseStart(startPhase);
    this.fabricCanvas.renderAll();

    this.animState.set(startPaused ? 'paused' : 'playing');
    this.animPhaseIndex = startPhaseIndex;
    this.animPhase = startPhase;
    this.animScheduledPaths = createPhasePathSchedule(startPhase as unknown as Phase);

    try {
      for (const [i, phase] of this._phases.entries()) {
        if (i < startPhaseIndex) continue;
        while (this.animState() === 'paused') await new Promise<void>(r => setTimeout(r, 50));
        if (this.animState() === 'idle') break;

        this.animPhaseIndex = i;
        this.animProgress.set(i / this._phases.length);
        await this.animatePhase(phase);
      }

      while (this.animState() === 'paused') await new Promise<void>(r => setTimeout(r, 50));
      if (this.animState() !== 'idle') {
        this.animProgress.set(1);
        await new Promise<void>(r => setTimeout(r, 600));
      }
    } finally {
      const restartPhase = this.pendingRestartPhase;
      this.pendingRestartPhase = null;

      this.animState.set('idle');
      this.animProgress.set(0);
      this.animTick = null;
      this.animPhase = null;
      this.animScheduledPaths = [];

      restoreSavedTokenPositions(this.tokens as unknown as PlayerToken[], savedPositions);
      this.ballCarrierIds.set(savedCarrierIds);
      this.clearAnimatedPhaseObjects();
      this.updateBallIndicators();

      this.currentPhasePaths.forEach(p => p.fabricObjects.forEach(o => o.set({ visible: true })));
      this.refreshShadowTokens();
      this.fabricCanvas.renderAll();

      if (restartPhase !== null) setTimeout(() => this.previewPlay(restartPhase, true), 50);
    }
  }

  private animatePhase(phase: ExercisePhase): Promise<void> {
    return new Promise(resolve => {
      this.activeAnimResolve = resolve;
      const scheduledPaths = createPhasePathSchedule(phase as unknown as Phase);
      this.animPhase = phase;
      this.animScheduledPaths = scheduledPaths;

      syncTokensToPhasePositions(this.tokens as unknown as PlayerToken[], phase.playerPositions);
      this.animPositionBallsAtPhaseStart(phase);
      this.updateAnimatedPhaseObjects(phase, scheduledPaths, 0);
      this.fabricCanvas.renderAll();

      const PRE_DELAY = 300;
      const duration = this.ANIM_DURATION / this.animSpeed();
      this.animDuration = duration;
      this.animElapsed = 0;
      this.animLastNow = null;

      setTimeout(() => {
        if (this.animState() === 'idle') {
          this.clearAnimatedPhaseObjects();
          this.fabricCanvas.renderAll();
          this.activeAnimResolve = null;
          resolve();
          return;
        }

        const renderAt = (t: number) => {
          syncTokensToResolvedPositions(
            this.tokens as unknown as PlayerToken[],
            token => resolvePlayerPositionAtTime(token.id, phase as unknown as Phase, scheduledPaths, t),
          );
          this.animPositionAllBalls(phase, scheduledPaths, t);
          this.updateAnimatedPhaseObjects(phase, scheduledPaths, t);
          this.fabricCanvas.renderAll();
        };

        const tick: FrameRequestCallback = (now) => {
          const state = this.animState();
          if (state === 'idle') { this.activeAnimResolve = null; resolve(); return; }
          if (state === 'paused') { this.animLastNow = null; return; }

          if (this.animLastNow !== null) this.animElapsed += now - this.animLastNow;
          this.animLastNow = now;

          const t = Math.min(this.animElapsed / duration, 1);
          renderAt(t);

          if (t < 1) {
            this.animFrameId = requestAnimationFrame(tick);
          } else {
            renderAt(1);
            this.clearAnimatedPhaseObjects();
            this.fabricCanvas.renderAll();
            this.animElapsed = 0;
            this.animLastNow = null;
            this.activeAnimResolve = null;
            resolve();
          }
        };

        this.animTick = tick;
        this.animFrameId = requestAnimationFrame(tick);
      }, PRE_DELAY);
    });
  }

  private animPositionBallsAtPhaseStart(phase: ExercisePhase): void {
    const carrierPositions = phase.ballCarrierIds.map(id => {
      const token = this.tokens.find(t => t.id === id);
      return token ? { id, pos: phase.playerPositions[id] ?? token.position } : null;
    }).filter(Boolean) as Array<{ id: string; pos: Point }>;

    this.placeBallIndicatorsAt(
      carrierPositions.map(c => c.id),
      id => carrierPositions.find(c => c.id === id)?.pos ?? null,
    );
    this.fabricCanvas.renderAll();
  }

  private animPositionAllBalls(phase: ExercisePhase, scheduledPaths: ScheduledPath[], t: number): void {
    this.placeBallIndicatorsAt(
      phase.ballCarrierIds,
      id => resolvePlayerPositionAtTime(id, phase as unknown as Phase, scheduledPaths, t),
    );
  }

  private clearAnimatedPhaseObjects(): void {
    if (this.animatedPhaseObjects.length === 0) return;
    this.animatedPhaseObjects.forEach(o => this.fabricCanvas.remove(o));
    this.animatedPhaseObjects = [];
  }

  private updateAnimatedPhaseObjects(
    phase: ExercisePhase,
    scheduledPaths: ScheduledPath[],
    t: number,
  ): void {
    this.clearAnimatedPhaseObjects();
    if (!this.showAnimatedLines()) return;

    for (const sp of scheduledPaths) {
      const coverage = resolveScheduledPathCoverage(sp, t);
      const remaining = resolveRemainingPathPoints(sp.path.actionType, sp.path.points, coverage);
      if (!remaining || remaining.length < 2) continue;
      this.animatedPhaseObjects.push(...renderActionPathObjects({
        canvas: this.fabricCanvas,
        actionType: sp.path.actionType,
        points: remaining,
        style: PATH_STYLES[sp.path.actionType],
        opacity: sp.path.actionType === 'shoot' ? undefined : 0.9,
        preferLinePath: true,
      }));
    }
    this.bringTokensToFront();
  }

  stopAnimation(): void {
    if (this.animFrameId) { cancelAnimationFrame(this.animFrameId); this.animFrameId = null; }
    this.animTick = null;
    this.animElapsed = 0;
    this.animLastNow = null;
    this.clearAnimatedPhaseObjects();
    if (this.activeAnimResolve) { const r = this.activeAnimResolve; this.activeAnimResolve = null; r(); }
    this.animState.set('idle');
    this.animProgress.set(0);
  }

  togglePause(): void {
    if (this.animState() === 'playing') {
      this.animState.set('paused');
    } else if (this.animState() === 'paused') {
      this.animState.set('playing');
      this.animLastNow = null;
      if (this.animTick) this.animFrameId = requestAnimationFrame(this.animTick);
    }
  }

  rollbackPhase(): void {
    if (!this.isAnimating()) return;
    if (this.animElapsed > 400 || this.animPhaseIndex === 0) {
      this.animElapsed = 0;
      this.animLastNow = null;
      if (this.animState() === 'playing') this.animState.set('paused');
      if (this.animPhase) {
        syncTokensToPhasePositions(this.tokens as unknown as PlayerToken[], this.animPhase.playerPositions);
        this.animPositionBallsAtPhaseStart(this.animPhase);
        this.updateAnimatedPhaseObjects(this.animPhase, this.animScheduledPaths, 0);
        this.fabricCanvas.renderAll();
      }
    } else {
      this.pendingRestartPhase = this.animPhaseIndex - 1;
      if (this.animFrameId) { cancelAnimationFrame(this.animFrameId); this.animFrameId = null; }
      const resolve = this.activeAnimResolve;
      this.activeAnimResolve = null;
      this.animState.set('idle');
      resolve?.();
    }
  }

  // ── Save / Load ───────────────────────────────────────────────

  async save(): Promise<void> {
    if (!this.sessionId || !this.drillId || this.saving()) return;
    this.saving.set(true);
    try {
      const session = await this.trainingService.get(this.sessionId);
      if (!session) return;

      const drills: Drill[] = JSON.parse(session.drills || '[]');
      const idx = drills.findIndex(d => d.id === this.drillId);
      if (idx === -1) return;

      const state = buildExerciseCanvasStateSnapshot({
        tokens: this.tokens,
        phases: this._phases,
        ballCarrierIds: this.ballCarrierIds(),
        currentPhaseIndex: this.currentPhaseIndex(),
        currentPhasePaths: this.currentPhasePaths,
        courtMode: this.courtMode(),
      });
      drills[idx] = { ...drills[idx], canvas_state: JSON.stringify(state) };
      await this.trainingService.save({ ...session, drills: JSON.stringify(drills) });
    } finally {
      this.saving.set(false);
    }
  }

  private async loadExercise(): Promise<void> {
    if (!this.sessionId || !this.drillId) return;
    const session = await this.trainingService.get(this.sessionId);
    if (!session) return;

    let drills: Drill[] = [];
    try { drills = JSON.parse(session.drills || '[]'); } catch { return; }
    const drill = drills.find(d => d.id === this.drillId);
    if (!drill) return;

    this.drillName.set(drill.name);

    const parsed = parseExerciseCanvasState(drill.canvas_state);
    if (parsed.kind !== 'valid') return;

    const state = parsed.state;

    if (state.courtMode !== this.courtMode()) {
      this.courtMode.set(state.courtMode);
      this.fabricCanvas.clear();
      this.applyCanvasLayout(state.courtMode);
      drawCourt(this.fabricCanvas, state.courtMode);
      this.attachCanvasEvents();
    }

    for (const t of state.tokens) {
      this.spawnToken(t.id, t.type, t.label, t.position.x, t.position.y);
      if (t.type === 'offense') this.offenseCount++;
      else if (t.type === 'defense') this.defenseCount++;
      else if (t.type === 'coach') this.coachCount++;
    }

    this._phases = state.phases;
    this.phaseCount.set(this._phases.length);
    this.ballCarrierIds.set([...state.ballCarrierIds]);
    this.currentPhaseIndex.set(state.currentPhaseIndex);

    for (const path of state.currentPhasePaths) this.redrawStoredPath(path);

    this.refreshShadowTokens();
    this.updateBallIndicators();

    if (this._phases.length > 0) this.jumpToPhase(0);
  }

  back(): void {
    this.router.navigate(
      ['/teams', this.teamId, 'training'],
      this.sessionId ? { queryParams: { session: this.sessionId } } : {},
    );
  }
}
