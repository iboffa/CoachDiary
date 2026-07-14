import { Play } from '../../../shared/models/models';
import { CourtMode } from './court-painter';
import { ActionType, Phase, PlayerToken, Point, StoredPath, TokenType } from './play-editor.models';

const ACTION_TYPES: ActionType[] = ['dribble', 'pass', 'cut', 'screen', 'dribble-handoff', 'shoot'];
const TOKEN_TYPES: TokenType[] = ['offense', 'defense'];
const COURT_MODES: CourtMode[] = ['half', 'full'];

export interface PersistedPlayerToken {
  id: string;
  type: TokenType;
  label: string;
  position: Point;
}

export interface PlayEditorPersistedState {
  tokens: PersistedPlayerToken[];
  phases: Phase[];
  ballCarrierId: string | null;
  currentPhaseIndex: number;
  currentPhasePaths: StoredPath[];
  courtMode: CourtMode;
}

export type PlayEditorCanvasStateParseResult =
  | { kind: 'empty' }
  | { kind: 'editor-state'; state: PlayEditorPersistedState }
  | { kind: 'legacy'; state: unknown }
  | { kind: 'invalid' };

interface BuildPlayEditorStateSnapshotOptions {
  tokens: PlayerToken[];
  phases: Phase[];
  ballCarrierId: string | null;
  currentPhaseIndex: number;
  currentPhasePaths: StoredPath[];
  courtMode: CourtMode;
}

interface BuildPlaySavePayloadOptions {
  playId: string | null;
  name: string;
  description: string;
  category_id: string | undefined;
  state: PlayEditorPersistedState;
  thumbnail: string;
}

export function buildPlayEditorStateSnapshot({
  tokens,
  phases,
  ballCarrierId,
  currentPhaseIndex,
  currentPhasePaths,
  courtMode,
}: BuildPlayEditorStateSnapshotOptions): PlayEditorPersistedState {
  return {
    tokens: tokens.map(token => ({
      id: token.id,
      type: token.type,
      label: token.label,
      position: clonePoint(token.position),
    })),
    phases: phases.map(clonePhase),
    ballCarrierId,
    currentPhaseIndex,
    currentPhasePaths: currentPhasePaths.map(cloneStoredPath),
    courtMode,
  };
}

export function buildPlaySavePayload({
  playId,
  name,
  description,
  category_id,
  state,
  thumbnail,
}: BuildPlaySavePayloadOptions): Play {
  return {
    id: playId ?? undefined,
    name,
    description,
    category_id,
    canvas_state: JSON.stringify(state),
    thumbnail,
  };
}

export function parsePlayEditorCanvasState(raw?: string | null): PlayEditorCanvasStateParseResult {
  if (!raw || raw === '{}') {
    return { kind: 'empty' };
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isPlayEditorPersistedState(parsed)) {
      return { kind: 'legacy', state: parsed };
    }

    return {
      kind: 'editor-state',
      state: {
        tokens: parsed.tokens.map(token => ({
          id: token.id,
          type: token.type,
          label: token.label,
          position: clonePoint(token.position),
        })),
        phases: parsed.phases.map(clonePhase),
        ballCarrierId: parsed.ballCarrierId,
        currentPhaseIndex: parsed.currentPhaseIndex,
        currentPhasePaths: parsed.currentPhasePaths.map(cloneStoredPath),
        courtMode: parsed.courtMode,
      },
    };
  } catch {
    return { kind: 'invalid' };
  }
}

export function toDownloadFilename(playName: string, extension: string): string {
  const baseName = playName.trim().replace(/\s+/g, '_') || 'play';
  return `${baseName}.${extension}`;
}

function clonePhase(phase: Phase): Phase {
  return {
    playerPositions: Object.fromEntries(
      Object.entries(phase.playerPositions).map(([ownerId, position]) => [ownerId, clonePoint(position)]),
    ),
    ballCarrierId: phase.ballCarrierId,
    paths: phase.paths.map(cloneStoredPath),
  };
}

function cloneStoredPath(path: StoredPath): StoredPath {
  return {
    ownerId: path.ownerId,
    actionType: path.actionType,
    points: path.points.map(clonePoint),
    targetId: path.targetId,
  };
}

function clonePoint(point: Point): Point {
  return { x: point.x, y: point.y };
}

function isPlayEditorPersistedState(value: unknown): value is PlayEditorPersistedState {
  if (!isRecord(value)) return false;
  if (!Array.isArray(value['tokens']) || !value['tokens'].every(isPersistedPlayerToken)) return false;
  if (!Array.isArray(value['phases']) || !value['phases'].every(isPhase)) return false;
  if (value['ballCarrierId'] !== null && typeof value['ballCarrierId'] !== 'string') return false;
  if (typeof value['currentPhaseIndex'] !== 'number' || !Number.isFinite(value['currentPhaseIndex'])) return false;
  if (!Array.isArray(value['currentPhasePaths']) || !value['currentPhasePaths'].every(isStoredPath)) return false;
  if (!COURT_MODES.includes(value['courtMode'] as CourtMode)) return false;
  return true;
}

function isPersistedPlayerToken(value: unknown): value is PersistedPlayerToken {
  return isRecord(value)
    && typeof value['id'] === 'string'
    && TOKEN_TYPES.includes(value['type'] as TokenType)
    && typeof value['label'] === 'string'
    && isPoint(value['position']);
}

function isPhase(value: unknown): value is Phase {
  if (!isRecord(value)) return false;
  if (!isRecord(value['playerPositions'])) return false;
  if (!Object.values(value['playerPositions']).every(isPoint)) return false;
  if (value['ballCarrierId'] !== null && typeof value['ballCarrierId'] !== 'string') return false;
  if (!Array.isArray(value['paths']) || !value['paths'].every(isStoredPath)) return false;
  return true;
}

function isStoredPath(value: unknown): value is StoredPath {
  return isRecord(value)
    && typeof value['ownerId'] === 'string'
    && ACTION_TYPES.includes(value['actionType'] as ActionType)
    && Array.isArray(value['points'])
    && value['points'].every(isPoint)
    && (value['targetId'] === undefined || typeof value['targetId'] === 'string');
}

function isPoint(value: unknown): value is Point {
  return isRecord(value)
    && typeof value['x'] === 'number'
    && Number.isFinite(value['x'])
    && typeof value['y'] === 'number'
    && Number.isFinite(value['y']);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
