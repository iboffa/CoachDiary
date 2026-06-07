import { Canvas, Line, Path } from 'fabric';

// ─────────────────────────────────────────────────────────────
//  Scale & canvas dimensions
//  FIBA court: 28 m × 15 m   |   half-court: 14 m × 15 m
// ─────────────────────────────────────────────────────────────
const S = 34;          // pixels per metre

export const COURT_OUT_OF_BOUNDS_PADDING = 54;

export type CourtMode = 'half' | 'full';

export function courtSize(mode: CourtMode): { W: number; H: number } {
  return {
    W: (mode === 'half' ? 14 : 28) * S,   // 476 or 952
    H: 15 * S,                             // 510
  };
}

export function courtCanvasSize(mode: CourtMode): { width: number; height: number } {
  const { W, H } = courtSize(mode);
  return {
    width: W + (COURT_OUT_OF_BOUNDS_PADDING * 2),
    height: H + (COURT_OUT_OF_BOUNDS_PADDING * 2),
  };
}

// ─────────────────────────────────────────────────────────────
//  FIBA measurements  (all in pixels = metres × S)
// ─────────────────────────────────────────────────────────────
const H  = 15 * S;        // 510
const CY = H / 2;         // 255  – vertical centre

const HOOP_X   = Math.round(1.575 * S);   //  54  – hoop centre from endline
const BOARD_X  = Math.round(1.200 * S);   //  41  – front face of backboard
const BOARD_HW = Math.round(0.900 * S);   //  31  – half of backboard width (1.83 m / 2 ≈ 0.9 m)
const HOOP_R   = 14;                       //  displayed radius (real ≈ 8 px – enlarged for visibility)

const KEY_D    = Math.round(5.80 * S);    // 197  – key depth (endline → FT line)
const KEY_HW   = Math.round(2.45 * S);    //  83  – key half-width (4.9 m / 2)

const FT_R     = Math.round(1.80 * S);    //  61  – FT-circle radius

const TP_R     = Math.round(6.75 * S);    // 230  – 3-point arc radius
const CORNER_Y = Math.round(0.90 * S);    //  31  – corner 3-pt line from sideline

const NCS_R    = Math.round(1.25 * S);    //  43  – no-charge semicircle radius
const CTR_R    = Math.round(1.80 * S);    //  61  – centre circle radius

// ─────────────────────────────────────────────────────────────
//  Style constants
// ─────────────────────────────────────────────────────────────
const WHITE  = 'rgba(255,255,255,0.90)';
const PAINT  = 'rgba(20,55,110,0.45)';
const ORANGE = '#f97316';

const WOOD_PLANKS = [
  '#F9E494', '#F5DC86', '#FCEA9E', '#F1D47C', '#F7E08E',
  '#F3DC84', '#FAE698', '#EFCE7A', '#F7E08C', '#F5DC84',
];
const PLANK_H = 10;

const lineOpts = { stroke: WHITE, strokeWidth: 2, selectable: false, evented: false } as const;
const pathOpts = { stroke: WHITE, strokeWidth: 2, fill: 'transparent', selectable: false, evented: false } as const;

/** Straight line using absolute canvas coordinates */
const L = (x1: number, y1: number, x2: number, y2: number, w = 2) =>
  new Line([x1, y1, x2, y2], { ...lineOpts, strokeWidth: w });

/** Rectangle as a closed Path – fill & stroke, no origin ambiguity */
const R = (x1: number, y1: number, x2: number, y2: number, fill = PAINT) =>
  new Path(`M ${x1} ${y1} L ${x2} ${y1} L ${x2} ${y2} L ${x1} ${y2} Z`, {
    fill, stroke: WHITE, strokeWidth: 2, selectable: false, evented: false,
  });

/** Full circle as a closed Path – avoids Fabric origin issues */
const C = (cx: number, cy: number, r: number, fill = 'transparent', color = WHITE, sw = 2) =>
  new Path(
    `M ${cx} ${cy - r} ` +
    `A ${r} ${r} 0 0 1 ${cx} ${cy + r} ` +
    `A ${r} ${r} 0 0 1 ${cx} ${cy - r} Z`,
    { fill, stroke: color, strokeWidth: sw, selectable: false, evented: false },
  );

/** Open arc from (sx,sy) to (ex,ey) on a circle of radius r.
 *  sweep: 1 = clockwise, 0 = counter-clockwise
 *  large: 1 = long arc                                        */
const A = (sx: number, sy: number, ex: number, ey: number, r: number,
           sweep = 1, large = 0, opts: object = pathOpts) =>
  new Path(`M ${sx} ${sy} A ${r} ${r} 0 ${large} ${sweep} ${ex} ${ey}`, opts);

// ─────────────────────────────────────────────────────────────
//  Hardwood floor background
//  Uses fat-stroke Line objects so negative world-space coords
//  (outside the court boundary padding) render correctly.
// ─────────────────────────────────────────────────────────────
function buildHardwood(W: number): Line[] {
  const lines: Line[] = [];
  const sy = -COURT_OUT_OF_BOUNDS_PADDING;
  const ey =  H + COURT_OUT_OF_BOUNDS_PADDING;
  const sx = -COURT_OUT_OF_BOUNDS_PADDING;
  const ex =  W + COURT_OUT_OF_BOUNDS_PADDING;
  const count = Math.ceil((ey - sy) / PLANK_H) + 2;

  // Fat lines act as coloured plank bands
  for (let i = 0; i < count; i++) {
    const y = sy + i * PLANK_H + PLANK_H / 2;
    const stroke = WOOD_PLANKS[(i * 3 + Math.floor(i / 7)) % WOOD_PLANKS.length];
    lines.push(new Line([sx, y, ex, y], { stroke, strokeWidth: PLANK_H + 1, selectable: false, evented: false }));
  }

  // Thin separator lines between planks
  for (let i = 1; i < count; i++) {
    const y = sy + i * PLANK_H;
    lines.push(new Line([sx, y, ex, y], { stroke: 'rgba(0,0,0,0.14)', strokeWidth: 1, selectable: false, evented: false }));
  }

  return lines;
}

// ─────────────────────────────────────────────────────────────
//  Main entry point
// ─────────────────────────────────────────────────────────────
export function drawCourt(canvas: Canvas, mode: CourtMode = 'half'): void {
  const { W } = courtSize(mode);

  (canvas as any).backgroundColor = '#F7E08C';

  const o: (Line | Path)[] = [...buildHardwood(W)];

  // Boundary
  o.push(L(0, 0, W, 0), L(0, H, W, H), L(0, 0, 0, H), L(W, 0, W, H));

  if (mode === 'full') {
    const cx = W / 2;
    o.push(L(cx, 0, cx, H));          // centre line
    o.push(C(cx, CY, CTR_R));         // centre circle
    addEnd(o, 0, +1);                  // left basket
    addEnd(o, W, -1);                  // right basket
  } else {
    // Half-court: basket at left, centre-circle stub at right edge
    addEnd(o, 0, +1);
    o.push(A(W, CY - CTR_R, W, CY + CTR_R, CTR_R, 0));  // left-facing arc stub
  }

  canvas.add(...o);
  canvas.renderAll();
}

// ─────────────────────────────────────────────────────────────
//  One basket end
//  baseline = x of the endline  |  dir = +1 (left) or -1 (right)
// ─────────────────────────────────────────────────────────────
function addEnd(o: (Line | Path)[], baseline: number, dir: number): void {
  const hx  = baseline + dir * HOOP_X;   // hoop centre x
  const bx  = baseline + dir * BOARD_X;  // backboard x
  const ftx = baseline + dir * KEY_D;    // FT-line x

  // Key x-extents
  const kx1 = dir > 0 ? baseline : ftx;
  const kx2 = dir > 0 ? ftx      : baseline;

  // ── Paint rectangle ──────────────────────────────────────────
  o.push(R(kx1, CY - KEY_HW, kx2, CY + KEY_HW));

  // ── FT-lane rebound tick marks (on outer sides of key) ───────
  // FIBA: at approximately 2.9 m and 4.1 m from the endline
  for (const dm of [2.9, 4.1]) {
    const tx = baseline + dir * Math.round(dm * S);
    const tk = 16;   // tick length in pixels
    o.push(
      L(tx, CY - KEY_HW - tk, tx, CY - KEY_HW),
      L(tx, CY + KEY_HW,      tx, CY + KEY_HW + tk),
    );
  }

  // ── FT circle ────────────────────────────────────────────────
  // Solid half: faces the court (away from basket)
  //   Left end → sweep clockwise (1)   Right end → counter-clockwise (0)
  const ftSolid = dir > 0 ? 1 : 0;
  o.push(
    A(ftx, CY - FT_R, ftx, CY + FT_R, FT_R, ftSolid),                 // solid
    A(ftx, CY - FT_R, ftx, CY + FT_R, FT_R, 1 - ftSolid, 0,           // dashed
      { stroke: WHITE, strokeWidth: 2, fill: 'transparent', strokeDashArray: [8, 6], selectable: false, evented: false }),
  );

  // ── Backboard (thick) ─────────────────────────────────────────
  o.push(L(bx, CY - BOARD_HW, bx, CY + BOARD_HW, 4));

  // ── Hoop ─────────────────────────────────────────────────────
  o.push(C(hx, CY, HOOP_R, 'transparent', ORANGE, 3));

  // ── No-charge semicircle (faces court) ───────────────────────
  // sweep=0 (CCW) for left basket → arc passes through east side (toward court)
  // sweep=1 (CW)  for right basket → arc passes through west side (toward court)
  o.push(A(hx, CY + NCS_R, hx, CY - NCS_R, NCS_R, dir > 0 ? 0 : 1));

  // ── Corner 3-point lines ──────────────────────────────────────
  const cy1 = CORNER_Y;              // near top sideline
  const cy2 = H - CORNER_Y;         // near bottom sideline
  const dy  = CY - cy1;             // vertical offset from centre
  // x where the 3-point arc meets the corner line
  const arcJx = hx + dir * Math.sqrt(Math.max(0, TP_R ** 2 - dy ** 2));

  o.push(
    L(baseline, cy1, arcJx, cy1),
    L(baseline, cy2, arcJx, cy2),
  );

  // ── 3-point arc ───────────────────────────────────────────────
  o.push(A(arcJx, cy1, arcJx, cy2, TP_R, dir > 0 ? 1 : 0));
}
