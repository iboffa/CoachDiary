import { Circle, FabricObject, Group } from 'fabric';
import { PATH_STYLES } from './play-editor.constants';
import {
  ensureEditableMovementPoints,
  findLatestMovementPath,
  findPlayerToken,
  getRestoredShadowPosition,
  isEditableMovementPath,
  listShadowTokenDrafts,
  shouldRemoveShadowPlaceholder,
  updatePathEndpointPreservingControl,
} from './play-editor-editing.utils';
import { renderActionPathObjects } from './play-editor-fabric.utils';
import { PathEditState, PhasePath, PlayerToken, Point, ShadowToken } from './play-editor.models';

export interface RefreshShadowTokensOptions {
  fabricCanvas: {
    add: (...objects: FabricObject[]) => unknown;
    remove: (object: FabricObject) => unknown;
  };
  tokens: PlayerToken[];
  currentPhasePaths: PhasePath[];
  shadowTokens: ShadowToken[];
  activePathEdit: PathEditState | null;
  createTokenGroup: (type: PlayerToken['type'], label: string, x: number, y: number, isShadow?: boolean) => Group;
  clearPathEditing: () => void;
  syncCanvasInteractivity: () => void;
}

export interface SyncDraggedShadowPlaceholderOptions {
  fabricCanvas: {
    remove: (object: FabricObject) => unknown;
  };
  tokens: PlayerToken[];
  shadowTokens: ShadowToken[];
  shadow: ShadowToken;
  end: Point;
  syncCanvasInteractivity: () => void;
}

export interface ApplyShadowEndpointEditOptions {
  fabricCanvas: {
    add: (...objects: FabricObject[]) => unknown;
    remove: (object: FabricObject) => unknown;
    renderAll: () => unknown;
  };
  tokens: PlayerToken[];
  currentPhasePaths: PhasePath[];
  shadow: ShadowToken;
  activePathEdit: PathEditState | null;
  preservePlaceholder?: boolean;
  rebuildEditablePath: (path: PhasePath) => void;
  beginPathEditing: (path: PhasePath, refreshShadow?: boolean) => void;
  refreshShadowTokens: () => void;
  syncDraggedShadowPlaceholder: (shadow: ShadowToken, end: Point) => void;
  updateBallIndicator: () => void;
}

export interface ErasePlayEditorObjectOptions {
  fabricCanvas: {
    remove: (object: FabricObject) => unknown;
  };
  tokens: PlayerToken[];
  currentPhasePaths: PhasePath[];
  ballCarrierId: string | null;
  ballIndicator: Circle | null;
  activePathEdit: PathEditState | null;
  object: FabricObject;
  clearPathEditing: () => void;
}

export interface ErasePlayEditorObjectResult {
  tokens: PlayerToken[];
  currentPhasePaths: PhasePath[];
  ballCarrierId: string | null;
  ballIndicator: Circle | null;
  erased: boolean;
}

function arePointsEqual(a?: Point, b?: Point): boolean {
  if (!a || !b) return false;
  return Math.hypot(a.x - b.x, a.y - b.y) < 0.001;
}

function isPassLikeAction(action: PhasePath['actionType']): boolean {
  return action === 'pass' || action === 'dribble-handoff';
}

function isBallDependentAction(action: PhasePath['actionType']): boolean {
  return isPassLikeAction(action) || action === 'shoot';
}

export function createPathControlHandle(path: PhasePath): Circle {
  const style = PATH_STYLES[path.actionType];
  const handle = new Circle({
    radius: 8,
    fill: '#ffffff',
    stroke: style.stroke,
    strokeWidth: 2,
    left: path.points[1].x,
    top: path.points[1].y,
    originX: 'center',
    originY: 'center',
    selectable: true,
    evented: true,
    hasControls: false,
    hasBorders: false,
    hoverCursor: 'move',
  });
  (handle as Circle & { __pathEditHandle?: boolean }).__pathEditHandle = true;
  return handle;
}

export function removeTaggedPathHandles(
  fabricCanvas: { getObjects: () => FabricObject[]; remove: (object: FabricObject) => unknown },
  isPathEditHandle: (target?: FabricObject) => boolean,
  except?: Circle,
): void {
  for (const object of [...fabricCanvas.getObjects()]) {
    if (!isPathEditHandle(object) || object === except) continue;
    fabricCanvas.remove(object);
  }
}

export function clearShadowTokens(
  fabricCanvas: { remove: (object: FabricObject) => unknown },
  shadowTokens: ShadowToken[],
): ShadowToken[] {
  shadowTokens.forEach(shadow => fabricCanvas.remove(shadow.fabricGroup));
  return [];
}

export function rebuildEditablePath(
  fabricCanvas: { add: (...objects: FabricObject[]) => unknown; remove: (object: FabricObject) => unknown },
  path: PhasePath,
): void {
  path.fabricObjects.forEach(object => fabricCanvas.remove(object));
  path.fabricObjects = renderActionPathObjects({
    canvas: fabricCanvas as never,
    actionType: path.actionType,
    points: path.points,
    style: PATH_STYLES[path.actionType],
    evented: true,
  });
}

export function syncDraggedShadowPlaceholder({
  fabricCanvas,
  tokens,
  shadowTokens,
  shadow,
  end,
  syncCanvasInteractivity,
}: SyncDraggedShadowPlaceholderOptions): ShadowToken[] {
  const token = findPlayerToken(tokens, shadow.ownerId);
  if (shouldRemoveShadowPlaceholder(token, end)) {
    fabricCanvas.remove(shadow.fabricGroup);
    syncCanvasInteractivity();
    return shadowTokens.filter(candidate => candidate !== shadow);
  }

  shadow.position = { ...end };
  shadow.fabricGroup.set({ left: end.x, top: end.y });
  shadow.fabricGroup.setCoords();
  const others = shadowTokens.filter(candidate => candidate.ownerId !== shadow.ownerId || candidate === shadow);
  const nextShadowTokens = [...others.filter(candidate => candidate !== shadow), shadow];
  syncCanvasInteractivity();
  return nextShadowTokens;
}

export function refreshShadowTokens({
  fabricCanvas,
  tokens,
  currentPhasePaths,
  shadowTokens,
  activePathEdit,
  createTokenGroup,
  clearPathEditing,
  syncCanvasInteractivity,
}: RefreshShadowTokensOptions): ShadowToken[] {
  const draggedShadow = shadowTokens.find(shadow => activePathEdit?.path.ownerId === shadow.ownerId);
  clearShadowTokens(fabricCanvas, shadowTokens);

  const nextShadowTokens: ShadowToken[] = [];
  for (const shadowDraft of listShadowTokenDrafts(tokens, currentPhasePaths, draggedShadow?.ownerId)) {
    const group = createTokenGroup(
      shadowDraft.type,
      shadowDraft.label,
      shadowDraft.position.x,
      shadowDraft.position.y,
      true,
    );
    fabricCanvas.add(group);
    nextShadowTokens.push({
      ownerId: shadowDraft.ownerId,
      fabricGroup: group,
      position: { ...shadowDraft.position },
    });
  }

  if (draggedShadow) {
    const restoredPosition = getRestoredShadowPosition(tokens, currentPhasePaths, draggedShadow.ownerId);
    if (restoredPosition) {
      draggedShadow.position = restoredPosition;
      draggedShadow.fabricGroup.set({
        left: restoredPosition.x,
        top: restoredPosition.y,
      });
      draggedShadow.fabricGroup.setCoords();
      fabricCanvas.add(draggedShadow.fabricGroup);
      nextShadowTokens.push(draggedShadow);
    }
  }

  if (activePathEdit && !isEditableMovementPath(currentPhasePaths, activePathEdit.path)) {
    clearPathEditing();
    return nextShadowTokens;
  }

  syncCanvasInteractivity();
  return nextShadowTokens;
}

export function applyShadowEndpointEdit({
  fabricCanvas,
  currentPhasePaths,
  shadow,
  activePathEdit,
  preservePlaceholder = false,
  rebuildEditablePath,
  beginPathEditing,
  refreshShadowTokens,
  syncDraggedShadowPlaceholder,
  updateBallIndicator,
}: ApplyShadowEndpointEditOptions): void {
  const path = findLatestMovementPath(currentPhasePaths, shadow.ownerId);
  if (!path) return;

  const nextEnd = { ...shadow.position };
  updatePathEndpointPreservingControl(path, nextEnd);

  rebuildEditablePath(path);
  if (preservePlaceholder) {
    syncDraggedShadowPlaceholder(shadow, nextEnd);
  } else {
    refreshShadowTokens();
  }

  if (activePathEdit?.path === path) {
    activePathEdit.controlHandle.set({ left: path.points[1].x, top: path.points[1].y });
    fabricCanvas.remove(activePathEdit.controlHandle);
    fabricCanvas.add(activePathEdit.controlHandle);
    activePathEdit.controlHandle.setCoords();
  } else {
    beginPathEditing(path, !preservePlaceholder);
  }

  updateBallIndicator();
  fabricCanvas.renderAll();
}

export function applyActivePathControlEdit(
  fabricCanvas: { add: (...objects: FabricObject[]) => unknown; renderAll: () => unknown },
  activePathEdit: PathEditState | null,
  rebuildEditablePath: (path: PhasePath) => void,
  refreshShadowTokens: () => void,
  updateBallIndicator: () => void,
  removeTaggedPathHandles: () => void,
  finalize: boolean,
): void {
  if (!activePathEdit) return;
  const { path, controlHandle } = activePathEdit;
  ensureEditableMovementPoints(path);
  path.points[1] = {
    x: controlHandle.left ?? path.points[1].x,
    y: controlHandle.top ?? path.points[1].y,
  };
  rebuildEditablePath(path);
  refreshShadowTokens();
  updateBallIndicator();
  if (finalize) {
    removeTaggedPathHandles();
    fabricCanvas.add(controlHandle);
  }
  controlHandle.set({ left: path.points[1].x, top: path.points[1].y });
  controlHandle.setCoords();
  fabricCanvas.renderAll();
}

export function erasePlayEditorObject({
  fabricCanvas,
  tokens,
  currentPhasePaths,
  ballCarrierId,
  ballIndicator,
  activePathEdit,
  object,
  clearPathEditing,
}: ErasePlayEditorObjectOptions): ErasePlayEditorObjectResult {
  const tokenIndex = tokens.findIndex(token => token.fabricGroup === object);
  if (tokenIndex !== -1) {
    const token = tokens[tokenIndex];
    if (activePathEdit?.path.ownerId === token.id) {
      clearPathEditing();
    }

    const ownedPaths = currentPhasePaths.filter(path => path.ownerId === token.id);
    ownedPaths.forEach(path => path.fabricObjects.forEach(candidate => fabricCanvas.remove(candidate)));
    const nextPaths = currentPhasePaths.filter(path => path.ownerId !== token.id);
    const nextTokens = [...tokens];
    nextTokens.splice(tokenIndex, 1);

    fabricCanvas.remove(object);

    let nextBallCarrierId = ballCarrierId;
    let nextBallIndicator = ballIndicator;
    if (token.id === ballCarrierId) {
      nextBallCarrierId = null;
      if (nextBallIndicator) {
        fabricCanvas.remove(nextBallIndicator);
        nextBallIndicator = null;
      }
    }
    return {
      tokens: nextTokens,
      currentPhasePaths: nextPaths,
      ballCarrierId: nextBallCarrierId,
      ballIndicator: nextBallIndicator,
      erased: true,
    };
  }

  const pathIndex = currentPhasePaths.findIndex(path => path.fabricObjects.includes(object));
  if (pathIndex !== -1) {
    const basePath = currentPhasePaths[pathIndex];
    const removedPathIndexes = new Set<number>([pathIndex]);

    if (isPassLikeAction(basePath.actionType) && basePath.targetId) {
      const pendingReceivers = new Set<string>([basePath.targetId]);
      for (let index = pathIndex + 1; index < currentPhasePaths.length; index++) {
        if (removedPathIndexes.has(index)) continue;

        const candidate = currentPhasePaths[index];
        if (!pendingReceivers.has(candidate.ownerId) || !isBallDependentAction(candidate.actionType)) {
          continue;
        }

        removedPathIndexes.add(index);
        if (isPassLikeAction(candidate.actionType) && candidate.targetId) {
          pendingReceivers.add(candidate.targetId);
        }
      }
    }

    let nextChainStart = basePath.points.at(-1);
    for (let index = pathIndex + 1; index < currentPhasePaths.length; index++) {
      const candidate = currentPhasePaths[index];
      if (candidate.ownerId !== basePath.ownerId || !arePointsEqual(candidate.points[0], nextChainStart)) {
        continue;
      }

      removedPathIndexes.add(index);
      nextChainStart = candidate.points.at(-1);
    }

    if (activePathEdit && removedPathIndexes.has(currentPhasePaths.indexOf(activePathEdit.path))) {
      clearPathEditing();
    }

    const nextPaths: PhasePath[] = [];
    for (let index = 0; index < currentPhasePaths.length; index++) {
      const path = currentPhasePaths[index];
      if (removedPathIndexes.has(index)) {
        path.fabricObjects.forEach(candidate => fabricCanvas.remove(candidate));
        continue;
      }
      nextPaths.push(path);
    }

    const nextBallCarrierId = isPassLikeAction(basePath.actionType)
      ? basePath.ownerId
      : ballCarrierId;

    return {
      tokens,
      currentPhasePaths: nextPaths,
      ballCarrierId: nextBallCarrierId,
      ballIndicator,
      erased: true,
    };
  }

  return {
    tokens,
    currentPhasePaths,
    ballCarrierId,
    ballIndicator,
    erased: false,
  };
}
