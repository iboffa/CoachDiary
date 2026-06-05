import { Canvas, FabricObject, Group } from 'fabric';
import { findEditablePath, hasNearbyPlayer, resolveInteractiveToken } from './play-editor-editing.utils';
import {
  ContextMenuState,
  PhasePath,
  PlayerToken,
  Point,
  ShadowToken,
  Tool,
} from './play-editor.models';

export interface PlayEditorCanvasEventBindings {
  canvas: Canvas;
  getActiveTool: () => Tool;
  getIsDrawing: () => boolean;
  getCurrentPhasePaths: () => PhasePath[];
  getTokens: () => PlayerToken[];
  getShadowTokens: () => ShadowToken[];
  getPendingDrawStart: () => Point | null;
  setPendingDrawStart: (point: Point | null) => void;
  getMouseDownPoint: () => Point | null;
  setMouseDownPoint: (point: Point | null) => void;
  getPendingPassFrom: () => string | null;
  setPendingPassFrom: (playerId: string | null) => void;
  getBallCarrierId: () => string | null;
  setContextMenu: (state: ContextMenuState | null) => void;
  isPathEditHandle: (target?: FabricObject) => boolean;
  clearPathEditing: () => void;
  startPath: (x: number, y: number) => void;
  updateLivePath: (x: number, y: number) => void;
  endPath: (x: number, y: number) => void;
  beginPathEditing: (path: PhasePath) => void;
  executePass: (passerId: string, receiverId: string) => void;
  eraseObject: (obj: FabricObject) => void;
  applyActivePathControlEdit: () => void;
  previewActivePathControlEdit: () => void;
  getGroupCenter: (group: Group) => Point;
  applyShadowEndpointEdit: (shadow: ShadowToken, preservePlaceholder?: boolean) => void;
  updateBallIndicator: () => void;
}

export function bindPlayEditorCanvasEvents(bindings: PlayEditorCanvasEventBindings): void {
  const canvas = bindings.canvas;
  canvas.off();

  canvas.on('mouse:down', event => {
    const mouseEvent = event.e as MouseEvent;
    bindings.setMouseDownPoint({ x: mouseEvent.clientX, y: mouseEvent.clientY });

    if (bindings.getActiveTool() === 'select') {
      const editablePath = findEditablePath(bindings.getCurrentPhasePaths(), event.target);
      if (!bindings.isPathEditHandle(event.target) && !editablePath) {
        bindings.setContextMenu(null);
        bindings.clearPathEditing();
      }
    }

    if (bindings.getActiveTool() === 'draw-path') {
      const pointer = canvas.getScenePoint(event.e);
      const pendingDrawStart = bindings.getPendingDrawStart();
      const startX = pendingDrawStart?.x ?? pointer.x;
      const startY = pendingDrawStart?.y ?? pointer.y;
      bindings.setPendingDrawStart(null);
      bindings.startPath(startX, startY);
    }
  });

  canvas.on('mouse:move', event => {
    if (bindings.getActiveTool() === 'draw-path' && bindings.getIsDrawing()) {
      const { x, y } = canvas.getScenePoint(event.e);
      bindings.updateLivePath(x, y);
    }
  });

  canvas.on('mouse:up', event => {
    const mouseEvent = event.e as MouseEvent;
    const mouseDownPoint = bindings.getMouseDownPoint();
    bindings.setMouseDownPoint(null);

    if (bindings.getActiveTool() === 'draw-path' && bindings.getIsDrawing()) {
      const { x, y } = canvas.getScenePoint(event.e);
      bindings.endPath(x, y);
      return;
    }

    if (bindings.getActiveTool() === 'select' && event.target && mouseDownPoint) {
      const distance = Math.hypot(mouseEvent.clientX - mouseDownPoint.x, mouseEvent.clientY - mouseDownPoint.y);
      if (distance < 5) {
        if (bindings.isPathEditHandle(event.target)) return;

        const editablePath = findEditablePath(bindings.getCurrentPhasePaths(), event.target);
        if (editablePath) {
          bindings.beginPathEditing(editablePath);
          return;
        }

        const token = resolveInteractiveToken(
          bindings.getTokens(),
          bindings.getShadowTokens(),
          bindings.getCurrentPhasePaths(),
          event.target,
        );
        if (token) {
          bindings.clearPathEditing();

          const passFromId = bindings.getPendingPassFrom();
          if (passFromId) {
            if (token.type === 'offense' && token.id !== passFromId) {
              bindings.executePass(passFromId, token.id);
            }
            bindings.setPendingPassFrom(null);
            return;
          }

          if (token.type === 'offense') {
            bindings.setContextMenu({
              clientX: mouseEvent.clientX,
              clientY: mouseEvent.clientY,
              playerId: token.id,
              isBallCarrier: token.id === bindings.getBallCarrierId(),
              hasNearbyPlayer: hasNearbyPlayer(bindings.getTokens(), bindings.getCurrentPhasePaths(), token.id),
            });
          }

          return;
        }

        bindings.setContextMenu(null);
        bindings.clearPathEditing();
      } else {
        bindings.setContextMenu(null);
      }
    } else if (bindings.getActiveTool() === 'select' && !event.target && mouseDownPoint) {
      const distance = Math.hypot(mouseEvent.clientX - mouseDownPoint.x, mouseEvent.clientY - mouseDownPoint.y);
      if (distance < 5) {
        bindings.setContextMenu(null);
        bindings.clearPathEditing();
      }
    }

    if (bindings.getActiveTool() === 'erase' && event.target) {
      bindings.eraseObject(event.target);
    }
  });

  canvas.on('object:modified', event => {
    if (bindings.isPathEditHandle(event.target)) {
      bindings.applyActivePathControlEdit();
      return;
    }

    const shadow = bindings.getShadowTokens().find(candidate => candidate.fabricGroup === event.target);
    if (shadow) {
      shadow.position = bindings.getGroupCenter(shadow.fabricGroup);
      bindings.applyShadowEndpointEdit(shadow, true);
      return;
    }

    const token = bindings.getTokens().find(candidate => candidate.fabricGroup === event.target);
    if (token) {
      token.position = bindings.getGroupCenter(token.fabricGroup);
      bindings.updateBallIndicator();
    }
  });

  canvas.on('object:moving', event => {
    if (bindings.isPathEditHandle(event.target)) {
      bindings.previewActivePathControlEdit();
      return;
    }

    const shadow = bindings.getShadowTokens().find(candidate => candidate.fabricGroup === event.target);
    if (shadow) {
      shadow.position = bindings.getGroupCenter(shadow.fabricGroup);
      bindings.applyShadowEndpointEdit(shadow, true);
    }
  });
}
