import { ExerciseCanvasState, ExercisePhase, ExerciseToken } from './exercise-editor.models';
import { CourtMode } from '../../playbook/play-editor/court-painter';
import { StoredPath } from '../../playbook/play-editor/play-editor.models';

export type ParsedExerciseCanvasState =
  | { kind: 'empty' }
  | { kind: 'invalid' }
  | { kind: 'valid'; state: ExerciseCanvasState };

export function parseExerciseCanvasState(raw: string | null | undefined): ParsedExerciseCanvasState {
  if (!raw) return { kind: 'empty' };
  try {
    const parsed = JSON.parse(raw) as Partial<ExerciseCanvasState>;
    if (parsed.version !== 1 || !Array.isArray(parsed.tokens)) return { kind: 'invalid' };
    return { kind: 'valid', state: parsed as ExerciseCanvasState };
  } catch {
    return { kind: 'invalid' };
  }
}

export function buildExerciseCanvasStateSnapshot(params: {
  tokens: ExerciseToken[];
  phases: ExercisePhase[];
  ballCarrierIds: string[];
  currentPhaseIndex: number;
  currentPhasePaths: StoredPath[];
  courtMode: CourtMode;
}): ExerciseCanvasState {
  return {
    version: 1,
    courtMode: params.courtMode,
    tokens: params.tokens.map(t => ({
      id: t.id,
      type: t.type,
      label: t.label,
      position: { ...t.position },
    })),
    phases: params.phases.map(phase => ({
      playerPositions: Object.fromEntries(
        Object.entries(phase.playerPositions).map(([k, v]) => [k, { ...v }]),
      ),
      ballCarrierIds: [...phase.ballCarrierIds],
      paths: phase.paths.map(p => ({
        ownerId: p.ownerId,
        actionType: p.actionType,
        points: p.points.map(pt => ({ ...pt })),
        targetId: p.targetId,
      })),
    })),
    ballCarrierIds: [...params.ballCarrierIds],
    currentPhaseIndex: params.currentPhaseIndex,
    currentPhasePaths: params.currentPhasePaths.map(p => ({
      ownerId: p.ownerId,
      actionType: p.actionType,
      points: p.points.map(pt => ({ ...pt })),
      targetId: p.targetId,
    })),
  };
}
