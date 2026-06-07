import jsPDF from 'jspdf';
import { Canvas, FabricObject } from 'fabric';
import { PATH_STYLES } from './play-editor.constants';
import { courtCanvasSize, CourtMode } from './court-painter';
import { renderActionPathObjects } from './play-editor-fabric.utils';
import { Phase, PlayerToken } from './play-editor.models';
import { syncTokensToPhasePositions, syncTokensToStoredPositions } from './play-editor-token-position.utils';

interface ExportPlayEditorVideoOptions {
  canvasElement: HTMLCanvasElement;
  phases: Phase[];
  downloadFilename: string;
  isPlaying: () => boolean;
  animatePhase: (phase: Phase) => Promise<void>;
  onStart: () => void;
  onFinish: () => void;
}

interface ExportPlayEditorPdfOptions {
  canvas: Canvas;
  phases: Phase[];
  tokens: PlayerToken[];
  courtMode: CourtMode;
  playName: string;
  downloadFilename: string;
}

interface CanvasExportStyleSnapshot {
  object: FabricObject;
  fill: FabricObject['fill'];
  stroke: FabricObject['stroke'];
  strokeWidth: FabricObject['strokeWidth'];
  strokeDashArray: FabricObject['strokeDashArray'];
}

interface CanvasBackgroundSnapshot {
  color: Canvas['backgroundColor'];
}

export function exportPlayEditorVideo({
  canvasElement,
  phases,
  downloadFilename,
  isPlaying,
  animatePhase,
  onStart,
  onFinish,
}: ExportPlayEditorVideoOptions): void {
  const stream = canvasElement.captureStream(30);
  const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
  const chunks: Blob[] = [];

  recorder.ondataavailable = event => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  };

  recorder.onstop = () => {
    const url = URL.createObjectURL(new Blob(chunks, { type: 'video/webm' }));
    Object.assign(document.createElement('a'), {
      href: url,
      download: downloadFilename,
    }).click();
    URL.revokeObjectURL(url);
  };

  recorder.start();
  onStart();

  const run = async () => {
    try {
      for (const phase of phases) {
        if (!isPlaying()) break;
        await animatePhase(phase);
      }
    } finally {
      onFinish();
      recorder.stop();
    }
  };

  void run();
}

export async function exportPlayEditorPdf({
  canvas,
  phases,
  tokens,
  courtMode,
  playName,
  downloadFilename,
}: ExportPlayEditorPdfOptions): Promise<void> {
  const { width, height } = courtCanvasSize(courtMode);
  const document = new jsPDF({ orientation: 'landscape', unit: 'px', format: [width, height + 60] });
  const baseStyleSnapshot = captureAndApplyOutlineStyle(canvas.getObjects());
  const backgroundSnapshot = applyPdfBackground(canvas);

  try {
    for (const [index, phase] of phases.entries()) {
      if (index > 0) {
        document.addPage();
      }

      syncTokensToPhasePositions(tokens, phase.playerPositions);
      const temporaryObjects = renderPhasePaths(canvas, phase);
      captureAndApplyOutlineStyle(temporaryObjects);

      canvas.renderAll();
      document.addImage(
        canvas.toDataURL({ multiplier: 1, format: 'jpeg', quality: 0.85 }),
        'JPEG',
        0,
        40,
        width,
        height,
      );
      document.setFontSize(12);
      document.text(`${playName} — Phase ${index + 1}`, 20, 22);

      temporaryObjects.forEach(object => canvas.remove(object));
    }

    document.save(downloadFilename);
  } finally {
    syncTokensToStoredPositions(tokens);
    restoreCanvasStyles(baseStyleSnapshot);
    restorePdfBackground(canvas, backgroundSnapshot);
    canvas.renderAll();
  }
}

function renderPhasePaths(canvas: Canvas, phase: Phase): FabricObject[] {
  const temporaryObjects: FabricObject[] = [];
  for (const path of phase.paths) {
    temporaryObjects.push(...renderActionPathObjects({
      canvas,
      actionType: path.actionType,
      points: path.points,
      style: PATH_STYLES[path.actionType],
      includeMarker: path.actionType !== 'shoot',
    }));
  }

  return temporaryObjects;
}

function captureAndApplyOutlineStyle(objects: FabricObject[]): CanvasExportStyleSnapshot[] {
  const snapshots: CanvasExportStyleSnapshot[] = [];

  for (const object of flattenExportObjects(objects)) {
    snapshots.push({
      object,
      fill: object.fill,
      stroke: object.stroke,
      strokeWidth: object.strokeWidth,
      strokeDashArray: object.strokeDashArray,
    });

    if (isTextObject(object)) {
      object.set({
        fill: '#000000',
        stroke: undefined,
      });
      continue;
    }

    object.set({
      fill: 'transparent',
      stroke: '#000000',
      strokeWidth: object.strokeWidth && object.strokeWidth > 0 ? object.strokeWidth : 2,
    });
  }

  return snapshots;
}

function restoreCanvasStyles(snapshots: CanvasExportStyleSnapshot[]): void {
  for (const snapshot of snapshots) {
    snapshot.object.set({
      fill: snapshot.fill,
      stroke: snapshot.stroke,
      strokeWidth: snapshot.strokeWidth,
      strokeDashArray: snapshot.strokeDashArray,
    });
  }
}

function applyPdfBackground(canvas: Canvas): CanvasBackgroundSnapshot {
  const snapshot: CanvasBackgroundSnapshot = { color: canvas.backgroundColor };
  canvas.backgroundColor = '#ffffff';
  return snapshot;
}

function restorePdfBackground(canvas: Canvas, snapshot: CanvasBackgroundSnapshot): void {
  canvas.backgroundColor = snapshot.color;
}

function flattenExportObjects(objects: FabricObject[]): FabricObject[] {
  const flattened: FabricObject[] = [];
  for (const object of objects) {
    flattened.push(object);
    if ('forEachObject' in object && typeof object.forEachObject === 'function') {
      object.forEachObject((child: FabricObject) => {
        flattened.push(...flattenExportObjects([child]));
      });
    }
  }
  return flattened;
}

function isTextObject(object: FabricObject): object is FabricObject & { text: string } {
  return typeof (object as FabricObject & { text?: unknown }).text === 'string';
}
