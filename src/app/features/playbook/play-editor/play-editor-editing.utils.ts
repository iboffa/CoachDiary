import { FabricObject } from 'fabric';
import {
  InteractiveToken,
  PhasePath,
  PlayerToken,
  Point,
  ShadowToken,
  TokenType,
} from './play-editor.models';
import { isMovementAction } from './play-editor-path.utils';

const CONTEXT_MENU_NEARBY_DISTANCE = 60;
const SHADOW_ENDPOINT_EPSILON = 1;

function supportsShadowPlaceholder(path: PhasePath): boolean {
  return path.actionType !== 'dribble-handoff';
}

export interface ShadowTokenDraft {
  ownerId: string;
  type: TokenType;
  label: string;
  position: Point;
}

export function findPlayerToken(tokens: PlayerToken[], ownerId: string): PlayerToken | undefined {
  return tokens.find(token => token.id === ownerId);
}

export function findLatestMovementPath(paths: PhasePath[], ownerId: string): PhasePath | null {
  for (let index = paths.length - 1; index >= 0; index--) {
    const path = paths[index];
    if (path.ownerId === ownerId && isMovementAction(path.actionType)) {
      return path;
    }
  }

  return null;
}

export function isEditableMovementPath(paths: PhasePath[], path: PhasePath): boolean {
  return isMovementAction(path.actionType) && findLatestMovementPath(paths, path.ownerId) === path;
}

export function findEditablePath(paths: PhasePath[], target?: FabricObject): PhasePath | null {
  if (!target) return null;
  return paths.find(path => isEditableMovementPath(paths, path) && path.fabricObjects.includes(target)) ?? null;
}

export function getCurrentAnchorPosition(
  tokens: PlayerToken[],
  paths: PhasePath[],
  ownerId: string,
): Point | null {
  for (let index = paths.length - 1; index >= 0; index--) {
    const path = paths[index];
    if (path.ownerId === ownerId && isMovementAction(path.actionType) && path.points.length >= 2) {
      return { ...path.points[path.points.length - 1] };
    }
  }

  const token = findPlayerToken(tokens, ownerId);
  return token ? { ...token.position } : null;
}

export function hasNearbyPlayer(tokens: PlayerToken[], paths: PhasePath[], ownerId: string): boolean {
  const anchor = getCurrentAnchorPosition(tokens, paths, ownerId);
  if (!anchor) return false;

  return tokens.some(token => {
    if (token.id === ownerId) return false;
    const other = getCurrentAnchorPosition(tokens, paths, token.id) ?? token.position;
    return Math.hypot(other.x - anchor.x, other.y - anchor.y) < CONTEXT_MENU_NEARBY_DISTANCE;
  });
}

export function ensureEditableMovementPoints(path: PhasePath): void {
  if (path.points.length >= 3) return;
  if (path.points.length !== 2) return;

  const [start, end] = path.points;
  path.points = [
    start,
    { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
    end,
  ];
}

export function findLatestMovementPaths(paths: PhasePath[]): PhasePath[] {
  const latestByOwner = new Map<string, PhasePath>();
  for (let index = paths.length - 1; index >= 0; index--) {
    const path = paths[index];
    if (
      !isMovementAction(path.actionType)
      || !supportsShadowPlaceholder(path)
      || path.points.length < 2
      || latestByOwner.has(path.ownerId)
    ) {
      continue;
    }
    latestByOwner.set(path.ownerId, path);
  }

  return [...latestByOwner.values()];
}

export function resolveInteractiveToken(
  tokens: PlayerToken[],
  shadowTokens: ShadowToken[],
  paths: PhasePath[],
  target?: FabricObject,
): InteractiveToken | null {
  if (!target) return null;

  const token = tokens.find(candidate => candidate.fabricGroup === target);
  if (token) {
    return {
      id: token.id,
      type: token.type,
      label: token.label,
      position: getCurrentAnchorPosition(tokens, paths, token.id) ?? token.position,
      isShadow: false,
    };
  }

  const shadow = shadowTokens.find(candidate => candidate.fabricGroup === target);
  if (!shadow) return null;

  const owner = findPlayerToken(tokens, shadow.ownerId);
  if (!owner) return null;

  return {
    id: owner.id,
    type: owner.type,
    label: owner.label,
    position: { ...shadow.position },
    isShadow: true,
  };
}

export function shouldRemoveShadowPlaceholder(token: PlayerToken | undefined, end: Point): boolean {
  return !token || Math.hypot(end.x - token.position.x, end.y - token.position.y) < SHADOW_ENDPOINT_EPSILON;
}

export function updatePathEndpointPreservingControl(path: PhasePath, nextEnd: Point): void {
  ensureEditableMovementPoints(path);

  const start = path.points[0];
  const previousEnd = path.points[path.points.length - 1];
  const previousMidpoint = {
    x: (start.x + previousEnd.x) / 2,
    y: (start.y + previousEnd.y) / 2,
  };
  const controlOffset = {
    x: path.points[1].x - previousMidpoint.x,
    y: path.points[1].y - previousMidpoint.y,
  };
  const nextMidpoint = {
    x: (start.x + nextEnd.x) / 2,
    y: (start.y + nextEnd.y) / 2,
  };

  path.points[1] = {
    x: nextMidpoint.x + controlOffset.x,
    y: nextMidpoint.y + controlOffset.y,
  };
  path.points[path.points.length - 1] = { ...nextEnd };
}

export function listShadowTokenDrafts(
  tokens: PlayerToken[],
  paths: PhasePath[],
  excludedOwnerId?: string,
): ShadowTokenDraft[] {
  return findLatestMovementPaths(paths)
    .filter(path => path.ownerId !== excludedOwnerId)
    .flatMap(path => {
      const token = findPlayerToken(tokens, path.ownerId);
      const end = path.points[path.points.length - 1];
      if (!token || shouldRemoveShadowPlaceholder(token, end)) {
        return [];
      }

      return [{
        ownerId: token.id,
        type: token.type,
        label: token.label,
        position: { ...end },
      }];
    });
}

export function getRestoredShadowPosition(
  tokens: PlayerToken[],
  paths: PhasePath[],
  ownerId: string,
): Point | null {
  const path = findLatestMovementPath(paths, ownerId);
  const token = findPlayerToken(tokens, ownerId);
  const end = path?.points.at(-1);
  if (!path || !supportsShadowPlaceholder(path) || !token || !end || shouldRemoveShadowPlaceholder(token, end)) {
    return null;
  }

  return { ...end };
}
