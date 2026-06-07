import { HOOP } from './play-editor.constants';
import { ActionType, Point, StoredPath } from './play-editor.models';
import { buildMovementSplinePoints } from './play-editor-path.utils';

const LIVE_DRAW_POINT_THRESHOLD = 6;
const END_POINT_MERGE_THRESHOLD = 1;
const MIN_PATH_SPAN = 6;
const MIN_HANDOFF_SPAN = 2;
const SHOOT_CONTROL_CLEARANCE = 50;

interface BuildDrawnMovementPathOptions {
  ownerId: string;
  actionType: ActionType;
  samples: Point[];
  endPoint: Point;
}

export function appendDrawPoint(samples: Point[], point: Point): Point[] {
  const last = samples[samples.length - 1];
  if (last && Math.hypot(point.x - last.x, point.y - last.y) < LIVE_DRAW_POINT_THRESHOLD) {
    return samples;
  }

  return [...samples, clonePoint(point)];
}

export function buildPassStoredPath(
  passerId: string,
  receiverId: string,
  from: Point,
  to: Point,
): StoredPath {
  return {
    ownerId: passerId,
    actionType: 'pass',
    points: [clonePoint(from), clonePoint(to)],
    targetId: receiverId,
  };
}

export function buildShootStoredPath(ownerId: string, from: Point): StoredPath {
  const control = {
    x: (from.x + HOOP.x) / 2,
    y: Math.min(from.y, HOOP.y) - SHOOT_CONTROL_CLEARANCE,
  };

  return {
    ownerId,
    actionType: 'shoot',
    points: [clonePoint(from), control, { ...HOOP }],
  };
}

export function buildDrawnMovementStoredPath({
  ownerId,
  actionType,
  samples,
  endPoint,
}: BuildDrawnMovementPathOptions): StoredPath | null {
  const normalizedSamples = normalizeDrawSamples(samples, endPoint);
  const points = buildMovementSplinePoints(normalizedSamples);
  const minSpan = actionType === 'dribble-handoff' ? MIN_HANDOFF_SPAN : MIN_PATH_SPAN;

  if (points.length < 2 || Math.hypot(points[points.length - 1].x - points[0].x, points[points.length - 1].y - points[0].y) < minSpan) {
    return null;
  }

  return {
    ownerId,
    actionType,
    points,
  };
}

function normalizeDrawSamples(samples: Point[], endPoint: Point): Point[] {
  const normalizedSamples = samples.map(clonePoint);
  const last = normalizedSamples[normalizedSamples.length - 1];

  if (!last || Math.hypot(endPoint.x - last.x, endPoint.y - last.y) > END_POINT_MERGE_THRESHOLD) {
    normalizedSamples.push(clonePoint(endPoint));
  } else {
    normalizedSamples[normalizedSamples.length - 1] = clonePoint(endPoint);
  }

  return normalizedSamples;
}

function clonePoint(point: Point): Point {
  return { x: point.x, y: point.y };
}
