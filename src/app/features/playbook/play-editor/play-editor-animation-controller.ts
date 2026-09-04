import { Canvas, Circle, FabricObject } from 'fabric';
import { BALL_INDICATOR_RADIUS, PATH_STYLES } from './play-editor.constants';
import {
  AnimState, Phase, PhasePath, PlayerToken, ScheduledPath, StoredPath,
} from './play-editor.models';
import {
  buildPhasePathSchedule,
  getBallIndicatorState,
  getPlayerPositionAtTime,
  getRemainingPathPoints,
  getScheduledPathCoverage,
} from './play-editor-path.utils';
import { renderActionPathObjects } from './play-editor-fabric.utils';
import {
  captureTokenPositions,
  restoreSavedTokenPositions,
  syncTokensToPhasePositions,
  syncTokensToResolvedPositions,
} from './play-editor-token-position.utils';

const ANIM_DURATION = 2500;
const PRE_DELAY = 300;
const REWIND_THRESHOLD_MS = 400;

export interface PlayAnimationControllerDeps {
  getCanvas: () => Canvas;
  getTokens: () => PlayerToken[];
  getPhases: () => Phase[];
  getCurrentPhasePaths: () => PhasePath[];
  getBallCarrierId: () => string | null;
  setBallCarrierId: (id: string | null) => void;
  getBallIndicator: () => Circle | null;
  setBallIndicator: (indicator: Circle | null) => void;
  getAnimSpeed: () => number;
  getShowAnimatedLines: () => boolean;
  getAnimState: () => AnimState;
  setAnimState: (state: AnimState) => void;
  setAnimProgress: (progress: number) => void;
  clearPathEditing: () => void;
  clearShadowTokens: () => void;
  refreshShadowTokens: () => void;
  bringTokensToFront: () => void;
  updateBallIndicator: () => void;
}

/** Drives phase-by-phase play preview/export playback: token motion, ball indicator motion, pause/rewind. */
export class PlayAnimationController {
  private animatedPhaseObjects: FabricObject[] = [];
  private animFrameId: number | null = null;
  private animTick: FrameRequestCallback | null = null;
  private animElapsed = 0;
  private animLastNow: number | null = null;
  private animPhaseIndex = 0;
  private animPhase: Phase | null = null;
  private animScheduledPaths: ScheduledPath[] = [];
  private pendingRestartPhase: number | null = null;
  private activeAnimResolve: (() => void) | null = null;

  constructor(private readonly deps: PlayAnimationControllerDeps) {}

  async preview(startPhaseIndex = 0, startPaused = false): Promise<void> {
    const phases = this.deps.getPhases();
    if (phases.length === 0) return;
    this.deps.clearPathEditing();
    this.clearAnimatedPhaseObjects();
    this.ensureBallIndicator();

    const canvas = this.deps.getCanvas();
    const tokens = this.deps.getTokens();
    const savedPositions = captureTokenPositions(tokens);
    const savedBallCarrier = this.deps.getBallCarrierId();

    this.deps.getCurrentPhasePaths().forEach(p => p.fabricObjects.forEach(o => o.set({ visible: false })));
    this.deps.clearShadowTokens();

    const startPhase = phases[startPhaseIndex];
    syncTokensToPhasePositions(tokens, startPhase.playerPositions);

    const initialSchedule = buildPhasePathSchedule(startPhase);
    this.positionBallAtPhaseStart(startPhase, initialSchedule);
    canvas.renderAll();

    this.deps.setAnimState(startPaused ? 'paused' : 'playing');
    this.animPhaseIndex = startPhaseIndex;
    this.animPhase = startPhase;
    this.animScheduledPaths = initialSchedule;

    try {
      for (const [i, phase] of phases.entries()) {
        if (i < startPhaseIndex) continue;

        // Wait while paused between phases
        while (this.deps.getAnimState() === 'paused') {
          await new Promise<void>(r => setTimeout(r, 50));
        }
        if (this.deps.getAnimState() === 'idle') break;

        this.animPhaseIndex = i;
        this.deps.setAnimProgress(i / phases.length);
        await this.animatePhase(phase);
      }

      // Brief hold at the end so user can see final state
      while (this.deps.getAnimState() === 'paused') {
        await new Promise<void>(r => setTimeout(r, 50));
      }
      if (this.deps.getAnimState() !== 'idle') {
        this.deps.setAnimProgress(1);
        await new Promise<void>(r => setTimeout(r, 600));
      }
    } finally {
      const restartPhase = this.pendingRestartPhase;
      this.pendingRestartPhase = null;

      this.deps.setAnimState('idle');
      this.deps.setAnimProgress(0);
      this.animTick = null;
      this.animPhase = null;
      this.animScheduledPaths = [];

      restoreSavedTokenPositions(tokens, savedPositions);
      this.deps.setBallCarrierId(savedBallCarrier);
      this.clearAnimatedPhaseObjects();
      this.deps.updateBallIndicator();

      this.deps.getCurrentPhasePaths().forEach(p => p.fabricObjects.forEach(o => o.set({ visible: true })));
      this.deps.refreshShadowTokens();
      canvas.renderAll();

      if (restartPhase !== null) {
        setTimeout(() => this.preview(restartPhase, true), 50);
      }
    }
  }

  animatePhase(phase: Phase): Promise<void> {
    return new Promise(resolve => {
      const canvas = this.deps.getCanvas();
      this.activeAnimResolve = resolve;
      const scheduledPaths = buildPhasePathSchedule(phase);
      this.animPhase = phase;
      this.animScheduledPaths = scheduledPaths;
      this.ensureBallIndicator();

      syncTokensToPhasePositions(this.deps.getTokens(), phase.playerPositions);
      this.positionBallAtPhaseStart(phase, scheduledPaths);
      this.updateAnimatedPhaseObjects(phase, scheduledPaths, 0);
      canvas.renderAll();

      const duration = ANIM_DURATION / this.deps.getAnimSpeed();
      this.animElapsed = 0;
      this.animLastNow = null;

      setTimeout(() => {
        if (this.deps.getAnimState() === 'idle') {
          this.clearAnimatedPhaseObjects();
          canvas.renderAll();
          this.activeAnimResolve = null;
          resolve();
          return;
        }

        const renderAt = (t: number) => {
          syncTokensToResolvedPositions(
            this.deps.getTokens(),
            token => getPlayerPositionAtTime(token.id, phase, scheduledPaths, t),
          );
          this.animateBallForPhase(phase, scheduledPaths, t);
          this.updateAnimatedPhaseObjects(phase, scheduledPaths, t);
          canvas.renderAll();
        };

        const tick: FrameRequestCallback = (now) => {
          const state = this.deps.getAnimState();

          if (state === 'idle') {
            this.activeAnimResolve = null;
            resolve();
            return;
          }

          if (state === 'paused') {
            this.animLastNow = null; // reset delta so resume doesn't jump
            return; // freeze — no next frame
          }

          if (this.animLastNow !== null) {
            this.animElapsed += now - this.animLastNow;
          }
          this.animLastNow = now;

          const t = Math.min(this.animElapsed / duration, 1);
          renderAt(t);

          if (t < 1) {
            this.animFrameId = requestAnimationFrame(tick);
          } else {
            renderAt(1);
            this.clearAnimatedPhaseObjects();
            canvas.renderAll();
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

  stop(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.animTick = null;
    this.animElapsed = 0;
    this.animLastNow = null;
    this.clearAnimatedPhaseObjects();
    if (this.activeAnimResolve) {
      const resolve = this.activeAnimResolve;
      this.activeAnimResolve = null;
      resolve();
    }
    this.deps.setAnimState('idle');
    this.deps.setAnimProgress(0);
  }

  togglePause(): void {
    const state = this.deps.getAnimState();
    if (state === 'playing') {
      this.deps.setAnimState('paused');
      // tick detects 'paused' on next frame and stops itself
    } else if (state === 'paused') {
      this.deps.setAnimState('playing');
      this.animLastNow = null; // prevent elapsed jump on resume
      if (this.animTick) {
        this.animFrameId = requestAnimationFrame(this.animTick);
      }
    }
  }

  rollbackPhase(): void {
    if (this.deps.getAnimState() === 'idle') return;

    if (this.animElapsed > REWIND_THRESHOLD_MS || this.animPhaseIndex === 0) {
      // Rewind to start of current phase, paused
      this.animElapsed = 0;
      this.animLastNow = null;
      if (this.deps.getAnimState() === 'playing') {
        this.deps.setAnimState('paused');
      }
      if (this.animPhase) {
        syncTokensToPhasePositions(this.deps.getTokens(), this.animPhase.playerPositions);
        this.positionBallAtPhaseStart(this.animPhase, this.animScheduledPaths);
        this.updateAnimatedPhaseObjects(this.animPhase, this.animScheduledPaths, 0);
        this.deps.getCanvas().renderAll();
      }
    } else {
      // Step back to previous phase — stop current play and restart from there
      this.pendingRestartPhase = this.animPhaseIndex - 1;
      if (this.animFrameId) {
        cancelAnimationFrame(this.animFrameId);
        this.animFrameId = null;
      }
      const resolve = this.activeAnimResolve;
      this.activeAnimResolve = null;
      this.deps.setAnimState('idle'); // triggers preview loop to break
      resolve?.();
    }
  }

  private ensureBallIndicator(): void {
    if (this.deps.getBallIndicator()) return;
    const indicator = new Circle({
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
    this.deps.getCanvas().add(indicator);
    this.deps.setBallIndicator(indicator);
  }

  private positionBallAtPhaseStart(phase: Phase, scheduledPaths: ScheduledPath[]): void {
    const indicator = this.deps.getBallIndicator();
    if (!indicator) return;
    indicator.set(getBallIndicatorState(phase, scheduledPaths, 0));
  }

  private animateBallForPhase(phase: Phase, scheduledPaths: ScheduledPath[], t: number): void {
    const indicator = this.deps.getBallIndicator();
    if (!indicator) return;
    indicator.set(getBallIndicatorState(phase, scheduledPaths, t));
  }

  private clearAnimatedPhaseObjects(): void {
    if (this.animatedPhaseObjects.length === 0) return;
    const canvas = this.deps.getCanvas();
    this.animatedPhaseObjects.forEach(obj => canvas.remove(obj));
    this.animatedPhaseObjects = [];
  }

  private createAnimatedPathObjects(path: StoredPath, coverage: number): FabricObject[] {
    const remainingPoints = getRemainingPathPoints(path.actionType, path.points, coverage);
    if (!remainingPoints || remainingPoints.length < 2) return [];

    return renderActionPathObjects({
      canvas: this.deps.getCanvas(),
      actionType: path.actionType,
      points: remainingPoints,
      style: PATH_STYLES[path.actionType],
      opacity: path.actionType === 'shoot' ? undefined : 0.9,
      preferLinePath: true,
    });
  }

  private updateAnimatedPhaseObjects(phase: Phase, scheduledPaths: ScheduledPath[], t: number): void {
    this.clearAnimatedPhaseObjects();
    if (!this.deps.getShowAnimatedLines()) return;

    for (const scheduledPath of scheduledPaths) {
      const coverage = getScheduledPathCoverage(scheduledPath, t);
      this.animatedPhaseObjects.push(...this.createAnimatedPathObjects(scheduledPath.path, coverage));
    }

    this.deps.bringTokensToFront();
  }
}
