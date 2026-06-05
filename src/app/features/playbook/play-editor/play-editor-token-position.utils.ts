import { TOKEN_RADIUS } from './play-editor.constants';
import { ActionType, PlayerToken, Point, StoredPath } from './play-editor.models';

export interface SavedTokenPosition {
  id: string;
  pos: Point;
}

export function captureTokenPositions(tokens: PlayerToken[]): SavedTokenPosition[] {
  return tokens.map(token => ({ id: token.id, pos: { ...token.position } }));
}

export function restoreSavedTokenPositions(tokens: PlayerToken[], savedPositions: SavedTokenPosition[]): void {
  for (const savedPosition of savedPositions) {
    const token = tokens.find(candidate => candidate.id === savedPosition.id);
    if (!token) continue;

    token.position = { ...savedPosition.pos };
    applyTokenGroupPosition(token, savedPosition.pos);
  }
}

export function syncTokensToStoredPositions(tokens: PlayerToken[]): void {
  for (const token of tokens) {
    applyTokenGroupPosition(token, token.position);
  }
}

export function syncTokensToPhasePositions(
  tokens: PlayerToken[],
  playerPositions: Record<string, Point>,
): void {
  for (const token of tokens) {
    const position = playerPositions[token.id];
    if (!position) continue;

    applyTokenGroupPosition(token, position);
  }
}

export function syncTokensToResolvedPositions(
  tokens: PlayerToken[],
  resolvePosition: (token: PlayerToken) => Point | null,
): void {
  for (const token of tokens) {
    const position = resolvePosition(token);
    if (!position) continue;

    applyTokenGroupPosition(token, position);
  }
}

export function advanceTokensToPathEndpoints(tokens: PlayerToken[], paths: StoredPath[]): void {
  for (const path of paths) {
    if (isBallOnlyAction(path.actionType) || path.points.length < 2) continue;

    const token = tokens.find(candidate => candidate.id === path.ownerId);
    if (!token) continue;

    const end = path.points[path.points.length - 1];
    token.position = { ...end };
    applyTokenGroupPosition(token, end);
  }
}

function applyTokenGroupPosition(token: PlayerToken, position: Point): void {
  token.fabricGroup.set({
    left: position.x - TOKEN_RADIUS,
    top: position.y - TOKEN_RADIUS,
  });
  token.fabricGroup.setCoords();
}

function isBallOnlyAction(action: ActionType): boolean {
  return action === 'pass' || action === 'shoot';
}
