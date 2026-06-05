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

  for (const [index, phase] of phases.entries()) {
    if (index > 0) {
      document.addPage();
    }

    syncTokensToPhasePositions(tokens, phase.playerPositions);
    const temporaryObjects = renderPhasePaths(canvas, phase);

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

  syncTokensToStoredPositions(tokens);
  canvas.renderAll();
  document.save(downloadFilename);
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
