import { ActionType, Point } from './play-editor.models';

export interface PathStyle {
  stroke: string;
  dash: number[] | null;
  width: number;
}

export const FIVE_OUT: Point[] = [
  { x: 285, y: 255 },
  { x: 218, y: 418 },
  { x: 118, y: 460 },
  { x: 218, y: 92 },
  { x: 118, y: 50 },
];

export const HOOP: Point = { x: 54, y: 255 };
export const TOKEN_RADIUS = 18;
// Below the mobile breakpoint the canvas is zoomed down to fit the device width
// (see fitCanvasToContainer), which shrinks these scene-space radii on screen —
// bump them so tap targets stay usable. Not a 1:1 fix for the 44px guideline
// (that would require doubling TOKEN_RADIUS and crowding close-together players),
// but a meaningful improvement over the desktop size.
export const MOBILE_TOKEN_RADIUS = 25;
export const MOBILE_PATH_HANDLE_RADIUS = 11;
export const PATH_HANDLE_RADIUS = 8;
export const SCREEN_USAGE_THRESHOLD = 42;
export const BALL_INDICATOR_RADIUS = 7;
export const BALL_INDICATOR_OFFSET: Point = { x: 8, y: -26 };

export const PATH_STYLES: Record<ActionType, PathStyle> = {
  dribble:           { stroke: '#111111', dash: null,    width: 2.5 },
  pass:              { stroke: '#111111', dash: [10, 6], width: 2.5 },
  cut:               { stroke: '#111111', dash: null,    width: 2.5 },
  screen:            { stroke: '#111111', dash: null,    width: 2.5 },
  'dribble-handoff': { stroke: '#111111', dash: [5, 4],  width: 2.5 },
  shoot:             { stroke: '#111111', dash: [6, 4],  width: 2.5 },
};
