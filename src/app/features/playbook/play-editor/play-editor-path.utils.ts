import {
  BALL_INDICATOR_OFFSET,
  SCREEN_USAGE_THRESHOLD,
} from './play-editor.constants';
import { ActionType, Phase, Point, ScheduledPath, StoredPath } from './play-editor.models';

export interface BallIndicatorState {
  visible: boolean;
  left?: number;
  top?: number;
}

function isPassLikeAction(action: ActionType): boolean {
  return action === 'pass' || action === 'dribble-handoff';
}

export function isMovementAction(action: ActionType): boolean {
  return !isPassLikeAction(action) && action !== 'shoot';
}

export function buildLinePath(points: Point[]): string {
  if (points.length === 0) return '';

  let pathData = `M ${points[0].x} ${points[0].y}`;
  for (let index = 1; index < points.length; index++) {
    pathData += ` L ${points[index].x} ${points[index].y}`;
  }

  return pathData;
}

export function buildMovementSplinePoints(samples: Point[]): Point[] {
  if (samples.length < 2) return samples;

  const start = samples[0];
  const end = samples[samples.length - 1];
  const midpoint = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
  let control = midpoint;
  let maxDeviation = 0;

  for (let index = 1; index < samples.length - 1; index++) {
    const sample = samples[index];
    const deviation = distanceToSegment(sample, start, end);
    if (deviation > maxDeviation) {
      maxDeviation = deviation;
      control = {
        x: midpoint.x + (sample.x - midpoint.x) * 0.75,
        y: midpoint.y + (sample.y - midpoint.y) * 0.75,
      };
    }
  }

  return [start, maxDeviation > 8 ? control : midpoint, end];
}

export function buildPathData(action: ActionType, points: Point[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  if (action === 'dribble') {
    return buildDribbleSinusoidPath(points);
  }

  if (isPassLikeAction(action)) {
    const end = points[points.length - 1];
    return `M ${points[0].x} ${points[0].y} L ${end.x} ${end.y}`;
  }

  if (points.length === 2) {
    const midpoint = { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 };
    return buildQuadraticPath(points[0], midpoint, points[1]);
  }

  if (points.length === 3) {
    return buildQuadraticPath(points[0], points[1], points[2]);
  }

  return buildSmoothPath(points);
}

function buildDribbleSinusoidPath(points: Point[]): string {
  const totalLength = measurePathLength('dribble', points);
  if (totalLength < 2) return buildLinePath(points);

  const AMPLITUDE = 6;
  const WAVELENGTH = 26;
  const steps = Math.max(60, Math.ceil(totalLength / 2));

  const resultPoints: Point[] = [];
  let arcLen = 0;
  let prev = interpolatePointOnPath('dribble', points, 0);

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const cur = interpolatePointOnPath('dribble', points, t);

    if (i > 0) {
      arcLen += Math.hypot(cur.x - prev.x, cur.y - prev.y);
    }

    const dt = 1 / steps;
    const p0 = interpolatePointOnPath('dribble', points, Math.max(0, t - dt));
    const p1 = interpolatePointOnPath('dribble', points, Math.min(1, t + dt));
    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    const len = Math.hypot(dx, dy);

    const nx = len > 1e-6 ? -dy / len : 0;
    const ny = len > 1e-6 ? dx / len : 0;

    // Taper amplitude to zero over the last TAPER_LENGTH pixels so the path
    // ends as a straight segment that sits cleanly under the arrowhead.
    const TAPER_LENGTH = 16;
    const remaining = totalLength - arcLen;
    const taper = remaining < TAPER_LENGTH ? remaining / TAPER_LENGTH : 1;
    const offset = AMPLITUDE * taper * Math.sin((arcLen / WAVELENGTH) * 2 * Math.PI);

    resultPoints.push({ x: cur.x + nx * offset, y: cur.y + ny * offset });
    prev = cur;
  }

  return buildLinePath(resultPoints);
}

export function buildPhasePathSchedule(phase: Phase): ScheduledPath[] {
  if (phase.paths.length === 0) return [];

  const durations = phase.paths.map(path => Math.max(measurePathLength(path.actionType, path.points), 1));
  const dependencies = phase.paths.map(() => new Set<number>());
  const resolvedTargets = phase.paths.map((path, index) =>
    isPassLikeAction(path.actionType) ? resolvePassTargetId(phase, phase.paths, path, index) : null,
  );

  const lastPathIndexByOwner = new Map<string, number>();

  for (let index = 0; index < phase.paths.length; index++) {
    const path = phase.paths[index];
    const previousOwnPath = lastPathIndexByOwner.get(path.ownerId);
    if (previousOwnPath !== undefined) {
      dependencies[index].add(previousOwnPath);
    }
    lastPathIndexByOwner.set(path.ownerId, index);

    if (!isPassLikeAction(path.actionType)) continue;

    const targetId = resolvedTargets[index];
    if (!targetId) continue;

    const previousTargetPath = findPreviousPathIndexByOwner(phase.paths, targetId, index);
    if (previousTargetPath !== null) {
      dependencies[index].add(previousTargetPath);
    }

    const nextTargetPath = findNextPathIndexByOwner(phase.paths, targetId, index);
    if (nextTargetPath !== null) {
      dependencies[nextTargetPath].add(index);
    }
  }

  for (let screenIndex = 0; screenIndex < phase.paths.length; screenIndex++) {
    const screenPath = phase.paths[screenIndex];
    if (screenPath.actionType !== 'screen') continue;

    const screenUsageIndices: number[] = [];

    for (let candidateIndex = screenIndex + 1; candidateIndex < phase.paths.length; candidateIndex++) {
      const candidate = phase.paths[candidateIndex];
      if (pathUsesScreen(candidate, screenPath)) {
        dependencies[candidateIndex].add(screenIndex);
        screenUsageIndices.push(candidateIndex);
      }

      if (candidate.ownerId === screenPath.ownerId && candidate.actionType === 'cut') {
        const latestUsageIndex = screenUsageIndices.at(-1);
        if (latestUsageIndex !== undefined) {
          dependencies[candidateIndex].add(latestUsageIndex);
        }
      }
    }
  }

  const rawStarts = new Array<number>(phase.paths.length).fill(0);
  const rawEnds = new Array<number>(phase.paths.length).fill(0);

  for (let index = 0; index < phase.paths.length; index++) {
    const start = [...dependencies[index]].reduce(
      (maxEnd, dependencyIndex) => Math.max(maxEnd, rawEnds[dependencyIndex]),
      0,
    );
    rawStarts[index] = start;
    rawEnds[index] = start + durations[index];
  }

  const totalDuration = Math.max(...rawEnds, 1);

  return phase.paths.map((path, index) => ({
    index,
    path,
    startTime: rawStarts[index] / totalDuration,
    endTime: rawEnds[index] / totalDuration,
    duration: durations[index],
    targetId: resolvedTargets[index],
  }));
}

export function getScheduledPathCoverage(path: ScheduledPath, time: number): number {
  const clampedTime = clamp01(time);
  if (clampedTime <= path.startTime) return 0;
  if (clampedTime >= path.endTime) return 1;

  const span = path.endTime - path.startTime;
  if (span <= 0) return 1;

  return (clampedTime - path.startTime) / span;
}

export function getRemainingPathPoints(
  action: ActionType,
  points: Point[],
  coverage: number,
): Point[] | null {
  const clampedCoverage = clamp01(coverage);
  if (clampedCoverage >= 1 || points.length < 2) return null;
  if (clampedCoverage <= 0) return points.map(point => ({ ...point }));

  if (points.length === 2 || isPassLikeAction(action)) {
    return [interpolatePointOnPath(action, points, clampedCoverage), points[points.length - 1]];
  }

  if (points.length === 3) {
    return splitQuadraticFrom(points[0], points[1], points[2], clampedCoverage);
  }

  const samples: Point[] = [];
  const steps = 10;
  for (let index = 0; index <= steps; index++) {
    const sampleT = clampedCoverage + ((1 - clampedCoverage) * index) / steps;
    samples.push(interpolatePointOnPath(action, points, sampleT));
  }

  return samples;
}

export function getPlayerPositionAtTime(
  ownerId: string,
  phase: Phase,
  scheduledPaths: ScheduledPath[],
  time: number,
): Point | null {
  const startingPosition = phase.playerPositions[ownerId];
  let currentPosition = startingPosition ? { ...startingPosition } : null;
  const ownerPaths = scheduledPaths.filter(
    scheduledPath => scheduledPath.path.ownerId === ownerId && isMovementAction(scheduledPath.path.actionType),
  );
  const clampedTime = clamp01(time);

  for (const scheduledPath of ownerPaths) {
    if (clampedTime < scheduledPath.startTime) {
      return currentPosition;
    }

    if (clampedTime >= scheduledPath.endTime) {
      currentPosition = { ...scheduledPath.path.points[scheduledPath.path.points.length - 1] };
      continue;
    }

    return interpolatePointOnPath(
      scheduledPath.path.actionType,
      scheduledPath.path.points,
      getScheduledPathCoverage(scheduledPath, clampedTime),
    );
  }

  return currentPosition;
}

export function getCarrierBallIndicatorState(position: Point): BallIndicatorState {
  return {
    left: position.x + BALL_INDICATOR_OFFSET.x,
    top: position.y + BALL_INDICATOR_OFFSET.y,
    visible: true,
  };
}

export function getBallIndicatorState(
  phase: Phase,
  scheduledPaths: ScheduledPath[],
  time: number,
): BallIndicatorState {
  const clampedTime = clamp01(time);
  const ballActions = scheduledPaths.filter(
    scheduledPath => isPassLikeAction(scheduledPath.path.actionType) || scheduledPath.path.actionType === 'shoot',
  );
  const activeAction = ballActions.find(
    scheduledPath => clampedTime >= scheduledPath.startTime && clampedTime < scheduledPath.endTime,
  );

  if (activeAction) {
    const localTime = getScheduledPathCoverage(activeAction, clampedTime);

    if (isPassLikeAction(activeAction.path.actionType) && activeAction.path.points.length >= 2) {
      const from = activeAction.path.points[0];
      const to = activeAction.path.points[1];
      return {
        left: from.x + BALL_INDICATOR_OFFSET.x + (to.x - from.x) * localTime,
        top: from.y + BALL_INDICATOR_OFFSET.y + (to.y - from.y) * localTime,
        visible: true,
      };
    }

    if (activeAction.path.actionType === 'shoot' && activeAction.path.points.length >= 3) {
      const [from, control, to] = activeAction.path.points;
      const sx = from.x + BALL_INDICATOR_OFFSET.x;
      const sy = from.y + BALL_INDICATOR_OFFSET.y;
      const ballX =
        (1 - localTime) * (1 - localTime) * sx +
        2 * (1 - localTime) * localTime * control.x +
        localTime * localTime * to.x;
      const ballY =
        (1 - localTime) * (1 - localTime) * sy +
        2 * (1 - localTime) * localTime * control.y +
        localTime * localTime * to.y;

      return {
        left: ballX,
        top: ballY,
        visible: true,
      };
    }
  }

  const completedShoot = [...ballActions].reverse().find(
    scheduledPath => scheduledPath.path.actionType === 'shoot' && clampedTime >= scheduledPath.endTime,
  );
  if (completedShoot && completedShoot.path.points.length >= 3) {
    const end = completedShoot.path.points[completedShoot.path.points.length - 1];
    return {
      left: end.x,
      top: end.y,
      visible: true,
    };
  }

  let carrierId = getPhaseStartBallCarrierId(phase, scheduledPaths);
  for (const action of ballActions) {
    if (action.endTime > clampedTime) break;
    if (isPassLikeAction(action.path.actionType)) {
      carrierId = action.targetId;
      continue;
    }

    carrierId = null;
  }

  if (!carrierId) {
    return { visible: false };
  }

  const position = getPlayerPositionAtTime(carrierId, phase, scheduledPaths, clampedTime);
  return position ? getCarrierBallIndicatorState(position) : { visible: false };
}

export function measurePathLength(action: ActionType, points: Point[]): number {
  if (points.length < 2) return 0;

  if (points.length === 3 && !isPassLikeAction(action)) {
    let total = 0;
    let previousPoint = interpolateQuadratic(points[0], points[1], points[2], 0);
    for (let step = 1; step <= 12; step++) {
      const nextPoint = interpolateQuadratic(points[0], points[1], points[2], step / 12);
      total += Math.hypot(nextPoint.x - previousPoint.x, nextPoint.y - previousPoint.y);
      previousPoint = nextPoint;
    }
    return total;
  }

  let total = 0;
  for (let index = 1; index < points.length; index++) {
    total += Math.hypot(points[index].x - points[index - 1].x, points[index].y - points[index - 1].y);
  }

  return total;
}

export function interpolatePointOnPath(action: ActionType, points: Point[], time: number): Point {
  const clampedTime = clamp01(time);
  if (points.length < 2) return points[0] ?? { x: 0, y: 0 };

  if (points.length === 3 && !isPassLikeAction(action)) {
    return interpolateQuadratic(points[0], points[1], points[2], clampedTime);
  }

  const segment = clampedTime * (points.length - 1);
  const index = Math.min(Math.floor(segment), points.length - 2);
  const fraction = segment - index;
  const start = points[index];
  const end = points[index + 1];
  return {
    x: start.x + (end.x - start.x) * fraction,
    y: start.y + (end.y - start.y) * fraction,
  };
}

export function interpolateQuadratic(start: Point, control: Point, end: Point, time: number): Point {
  const inverseTime = 1 - time;
  return {
    x: inverseTime * inverseTime * start.x + 2 * inverseTime * time * control.x + time * time * end.x,
    y: inverseTime * inverseTime * start.y + 2 * inverseTime * time * control.y + time * time * end.y,
  };
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function distanceToSegment(point: Point, start: Point, end: Point): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }

  const projection = ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared;
  const clampedProjection = clamp01(projection);
  const projectedX = start.x + dx * clampedProjection;
  const projectedY = start.y + dy * clampedProjection;
  return Math.hypot(point.x - projectedX, point.y - projectedY);
}

function buildQuadraticPath(start: Point, control: Point, end: Point): string {
  return `M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`;
}

function buildSmoothPath(points: Point[]): string {
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

  let pathData = `M ${points[0].x} ${points[0].y}`;
  for (let index = 1; index < points.length - 1; index++) {
    const midpointX = (points[index].x + points[index + 1].x) / 2;
    const midpointY = (points[index].y + points[index + 1].y) / 2;
    pathData += ` Q ${points[index].x} ${points[index].y} ${midpointX} ${midpointY}`;
  }

  const last = points[points.length - 1];
  const previous = points[points.length - 2];
  pathData += ` Q ${previous.x} ${previous.y} ${last.x} ${last.y}`;
  return pathData;
}

function resolvePassTargetId(
  phase: Phase,
  paths: StoredPath[],
  path: StoredPath,
  pathIndex: number,
): string | null {
  if (path.targetId) return path.targetId;
  if (path.points.length < 2) return null;

  const targetPoint = path.points[path.points.length - 1];
  let bestOwnerId: string | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const ownerId of Object.keys(phase.playerPositions)) {
    if (ownerId === path.ownerId) continue;

    const anchor = getPlayerAnchorBeforePath(phase, paths, ownerId, pathIndex);
    if (!anchor) continue;

    const distance = Math.hypot(anchor.x - targetPoint.x, anchor.y - targetPoint.y);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestOwnerId = ownerId;
    }
  }

  return bestDistance <= 60 ? bestOwnerId : null;
}

function getPlayerAnchorBeforePath(
  phase: Phase,
  paths: StoredPath[],
  ownerId: string,
  beforeIndex: number,
): Point | null {
  const startingPosition = phase.playerPositions[ownerId];
  let anchor = startingPosition ? { ...startingPosition } : null;

  for (let index = 0; index < beforeIndex; index++) {
    const path = paths[index];
    if (path.ownerId !== ownerId || !isMovementAction(path.actionType) || path.points.length < 2) continue;
    anchor = { ...path.points[path.points.length - 1] };
  }

  return anchor;
}

function pathUsesScreen(candidate: StoredPath, screenPath: StoredPath): boolean {
  if (candidate.ownerId === screenPath.ownerId) return false;
  if (!isMovementAction(candidate.actionType) || candidate.actionType === 'screen') return false;
  if (candidate.points.length < 2 || screenPath.points.length < 2) return false;

  const screenPoint = screenPath.points[screenPath.points.length - 1];
  const samples = samplePathPoints(candidate.actionType, candidate.points);
  return samples.some(
    point => Math.hypot(point.x - screenPoint.x, point.y - screenPoint.y) <= SCREEN_USAGE_THRESHOLD,
  );
}

function samplePathPoints(action: ActionType, points: Point[], steps = 18): Point[] {
  if (points.length < 2) return points.map(point => ({ ...point }));

  const samples: Point[] = [];
  for (let step = 0; step <= steps; step++) {
    samples.push(interpolatePointOnPath(action, points, step / steps));
  }

  return samples;
}

function findPreviousPathIndexByOwner(paths: StoredPath[], ownerId: string, beforeIndex: number): number | null {
  for (let index = beforeIndex - 1; index >= 0; index--) {
    if (paths[index].ownerId === ownerId) return index;
  }

  return null;
}

function findNextPathIndexByOwner(paths: StoredPath[], ownerId: string, afterIndex: number): number | null {
  for (let index = afterIndex + 1; index < paths.length; index++) {
    if (paths[index].ownerId === ownerId) return index;
  }

  return null;
}

function splitQuadraticFrom(start: Point, control: Point, end: Point, time: number): Point[] {
  const q0 = lerpPoint(start, control, time);
  const q1 = lerpPoint(control, end, time);
  const r0 = lerpPoint(q0, q1, time);
  return [r0, q1, end];
}

function lerpPoint(start: Point, end: Point, time: number): Point {
  return {
    x: start.x + (end.x - start.x) * time,
    y: start.y + (end.y - start.y) * time,
  };
}

function getPhaseStartBallCarrierId(phase: Phase, scheduledPaths: ScheduledPath[]): string | null {
  const firstBallAction = scheduledPaths.find(
    scheduledPath => isPassLikeAction(scheduledPath.path.actionType) || scheduledPath.path.actionType === 'shoot',
  );
  return firstBallAction?.path.ownerId ?? phase.ballCarrierId;
}
