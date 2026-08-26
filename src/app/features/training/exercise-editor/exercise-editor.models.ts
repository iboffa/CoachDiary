import { Group } from 'fabric';
import { CourtMode } from '../../playbook/play-editor/court-painter';
import { Point, StoredPath } from '../../playbook/play-editor/play-editor.models';

export type ExerciseTokenType = 'offense' | 'defense' | 'coach' | 'cone';

export interface ExerciseToken {
  fabricGroup: Group;
  id: string;
  type: ExerciseTokenType;
  label: string;
  position: Point;
}

export interface ExercisePhase {
  playerPositions: Record<string, Point>;
  ballCarrierIds: string[];
  paths: StoredPath[];
}

export interface ExerciseCanvasState {
  version: 1;
  courtMode: CourtMode;
  tokens: { id: string; type: ExerciseTokenType; label: string; position: Point }[];
  phases: ExercisePhase[];
  ballCarrierIds: string[];
  currentPhaseIndex: number;
  currentPhasePaths: StoredPath[];
}
