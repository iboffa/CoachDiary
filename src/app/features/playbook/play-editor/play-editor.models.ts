import { Circle, FabricObject, Group } from 'fabric';

export type Tool = 'select' | 'draw-path' | 'erase';
export type ActionType = 'dribble' | 'pass' | 'cut' | 'screen' | 'dribble-handoff' | 'shoot';
export type AnimState = 'idle' | 'playing' | 'paused';
export type TokenType = 'offense' | 'defense';
export interface Point { x: number; y: number }

export interface PlayerToken {
  fabricGroup: Group;
  id: string;
  type: TokenType;
  label: string;
  position: Point;
}

export interface StoredPath {
  ownerId: string;
  actionType: ActionType;
  points: Point[];
  targetId?: string;
}

export interface PhasePath extends StoredPath {
  fabricObjects: FabricObject[];
}

export interface Phase {
  playerPositions: Record<string, Point>;
  ballCarrierId: string | null;
  paths: StoredPath[];
}

export interface ShadowToken {
  fabricGroup: Group;
  ownerId: string;
  position: Point;
}

export interface InteractiveToken {
  id: string;
  type: TokenType;
  label: string;
  position: Point;
  isShadow: boolean;
}

export interface PathEditState {
  path: PhasePath;
  controlHandle: Circle;
}

export interface ContextMenuState {
  clientX: number;
  clientY: number;
  playerId: string;
  isBallCarrier: boolean;
  hasNearbyPlayer: boolean;
}

export interface ScheduledPath {
  index: number;
  path: StoredPath;
  startTime: number;
  endTime: number;
  duration: number;
  targetId: string | null;
}
