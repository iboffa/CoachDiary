import { Canvas, Circle, FabricObject, Path } from 'fabric';
import { PathStyle } from './play-editor.constants';
import { ActionType, Point } from './play-editor.models';
import { buildLinePath, buildPathData } from './play-editor-path.utils';

interface RenderActionPathOptions {
  canvas: Canvas;
  actionType: ActionType;
  points: Point[];
  style: PathStyle;
  evented?: boolean;
  selectable?: boolean;
  opacity?: number;
  includeMarker?: boolean;
  preferLinePath?: boolean;
  shootMarkerRadius?: number;
}

export function renderActionPathObjects({
  canvas,
  actionType,
  points,
  style,
  evented = false,
  selectable = false,
  opacity,
  includeMarker = true,
  preferLinePath = false,
  shootMarkerRadius = 4,
}: RenderActionPathOptions): FabricObject[] {
  if (points.length < 2) return [];

  const pathData = preferLinePath && points.length > 3
    ? buildLinePath(points)
    : buildPathData(actionType, points);

  const basePath = new Path(pathData, {
    stroke: style.stroke,
    strokeWidth: style.width,
    strokeDashArray: style.dash ?? undefined,
    fill: 'transparent',
    selectable,
    evented,
    opacity,
    strokeLineCap: 'round',
    strokeLineJoin: 'round',
  });
  const objects: FabricObject[] = [basePath];
  canvas.add(basePath);

  if (!includeMarker) {
    return objects;
  }

  if (actionType === 'shoot') {
    const end = points[points.length - 1];
    const marker = new Circle({
      radius: shootMarkerRadius,
      fill: style.stroke,
      left: end.x - shootMarkerRadius,
      top: end.y - shootMarkerRadius,
      selectable: false,
      evented: false,
    });
    canvas.add(marker);
    objects.push(marker);
    return objects;
  }

  if (actionType === 'screen') {
    objects.push(addScreenBar(canvas, points, style, evented));
    return objects;
  }

  objects.push(addArrowhead(canvas, points[points.length - 1], points[points.length - 2] ?? points[0], style, evented));
  return objects;
}

function addArrowhead(
  canvas: Canvas,
  tip: Point,
  previous: Point,
  style: PathStyle,
  evented = false,
): Path {
  const angle = Math.atan2(tip.y - previous.y, tip.x - previous.x);
  const size = 12;
  const arrow = new Path([
    `M ${tip.x} ${tip.y} L ${tip.x + size * Math.cos(angle + Math.PI * 0.8)} ${tip.y + size * Math.sin(angle + Math.PI * 0.8)}`,
    `M ${tip.x} ${tip.y} L ${tip.x + size * Math.cos(angle - Math.PI * 0.8)} ${tip.y + size * Math.sin(angle - Math.PI * 0.8)}`,
  ].join(' '), {
    stroke: style.stroke,
    strokeWidth: style.width,
    fill: 'transparent',
    selectable: false,
    evented,
    strokeLineCap: 'round',
  });
  canvas.add(arrow);
  return arrow;
}

function addScreenBar(
  canvas: Canvas,
  points: Point[],
  style: PathStyle,
  evented = false,
): Path {
  const tip = points[points.length - 1];
  const previous = points.length > 1 ? points[points.length - 2] : points[0];
  const angle = Math.atan2(tip.y - previous.y, tip.x - previous.x);
  const perpendicularAngle = angle + Math.PI / 2;
  const length = 16;
  const bar = new Path(
    `M ${tip.x + length * Math.cos(perpendicularAngle)} ${tip.y + length * Math.sin(perpendicularAngle)} L ${tip.x - length * Math.cos(perpendicularAngle)} ${tip.y - length * Math.sin(perpendicularAngle)}`,
    {
      stroke: style.stroke,
      strokeWidth: style.width,
      fill: 'transparent',
      selectable: false,
      evented,
      strokeLineCap: 'round',
    },
  );
  canvas.add(bar);
  return bar;
}
