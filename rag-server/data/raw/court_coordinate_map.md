# Court Coordinate Map — CoachDiary Canvas System

## 1. Canvas Overview

Section summary: This document defines the pixel coordinate system used by the CoachDiary play editor so that LLM-generated plays can be translated directly into PlayEditorPersistedState tokens and phase positions.

The CoachDiary play editor renders a half-court view on a canvas of approximately **570 px wide × 510 px tall**. The origin (0, 0) is the **top-left corner** of the canvas. The x-axis increases to the right; the y-axis increases downward. The basket (hoop centre) is positioned at the left edge of the canvas, centred vertically.

Key canvas anchors:

- Hoop centre: `{x: 54, y: 255}`
- Basket / restricted area centre: `{x: 54, y: 255}`
- Free-throw line centre (top of the key): `{x: 280, y: 255}`
- Half-court line (right edge of the half-court view): `{x: 570, y: 255}`
- Left sideline boundary: `{x: 0, y: 0}` to `{x: 0, y: 510}`
- Right sideline boundary: `{x: 570, y: 0}` to `{x: 570, y: 510}`
- Baseline (near hoop): `x ≈ 0–54`, full vertical span `y: 0–510`
- Three-point arc corner (top baseline side): `{x: 54, y: 90}`
- Three-point arc corner (bottom baseline side): `{x: 54, y: 420}`
- Three-point arc apex (top of arc, wing): approximately `{x: 380, y: 90}` and `{x: 380, y: 420}` for the flat portions; arc peak at approximately `{x: 400, y: 255}`

All coordinates in this document are approximate pixel values suitable for initial token placement. The play editor snaps tokens to the nearest valid court position.

---

## 2. Named Court Zones with Pixel Ranges

Section summary: This section maps basketball terminology to pixel bounding boxes so that prose play descriptions can be converted to canvas coordinates without ambiguity.

Each zone is defined as a rectangle `[x_min, x_max, y_min, y_max]` on the 570×510 canvas.

| Zone Name | x_min | x_max | y_min | y_max | Canonical centre point |
|---|---|---|---|---|---|
| Paint / Lane (full) | 54 | 190 | 165 | 345 | `{x: 122, y: 255}` |
| Restricted area | 54 | 100 | 210 | 300 | `{x: 77, y: 255}` |
| Low block (strong-side top) | 100 | 190 | 165 | 210 | `{x: 145, y: 188}` |
| Low block (strong-side bottom) | 100 | 190 | 300 | 345 | `{x: 145, y: 323}` |
| Elbow (top / north) | 160 | 220 | 165 | 210 | `{x: 190, y: 188}` |
| Elbow (bottom / south) | 160 | 220 | 300 | 345 | `{x: 190, y: 323}` |
| Free-throw line / top of the key | 240 | 310 | 230 | 280 | `{x: 280, y: 255}` |
| Short corner (top / north) | 54 | 160 | 90 | 165 | `{x: 107, y: 128}` |
| Short corner (bottom / south) | 54 | 160 | 345 | 420 | `{x: 107, y: 383}` |
| Corner three (top / north) | 54 | 120 | 55 | 90 | `{x: 87, y: 73}` |
| Corner three (bottom / south) | 54 | 120 | 420 | 455 | `{x: 87, y: 438}` |
| Wing (top / north) | 280 | 420 | 60 | 165 | `{x: 350, y: 113}` |
| Wing (bottom / south) | 280 | 420 | 345 | 450 | `{x: 350, y: 398}` |
| Top of the key / high slot | 280 | 420 | 195 | 315 | `{x: 350, y: 255}` |
| Mid-range (top / north mid) | 160 | 310 | 90 | 190 | `{x: 235, y: 140}` |
| Mid-range (bottom / south mid) | 160 | 310 | 320 | 420 | `{x: 235, y: 370}` |
| Half-court area | 420 | 570 | 0 | 510 | `{x: 500, y: 255}` |

**Directional convention:** In CoachDiary, "top" or "north" means the upper half of the canvas (small y values, y < 255). "Bottom" or "south" means the lower half (y > 255). "Strong side" means the side of the court where the ball currently is; "weak side" is the opposite side.

---

## 3. Typical Starting Positions by Roster Slot and Formation

Section summary: This section gives canonical pixel coordinates for each of the five offensive roster slots (PG=1, SG=2, SF=3, PF=4, C=5) in the most common half-court formations so the play editor can position tokens automatically before animating plays.

### 3.1 Five-Out (Perimeter) Formation

All five players start on or beyond the three-point arc, maximising driving lanes.

- Point guard (PG / 1): `{x: 370, y: 255}` — top of the key, ball-handler position
- Shooting guard (SG / 2): `{x: 330, y: 113}` — top wing, north side
- Small forward (SF / 3): `{x: 330, y: 398}` — top wing, south side
- Power forward (PF / 4): `{x: 87, y: 73}` — corner three, north side
- Center (C / 5): `{x: 87, y: 438}` — corner three, south side

### 3.2 HORNS Formation

Two players at elbows, two in corners, point guard at top with the ball.

- Point guard (PG / 1): `{x: 370, y: 255}` — top of the key
- Shooting guard (SG / 2): `{x: 87, y: 73}` — corner three, north side
- Small forward (SF / 3): `{x: 87, y: 438}` — corner three, south side
- Power forward (PF / 4): `{x: 190, y: 188}` — elbow, north side
- Center (C / 5): `{x: 190, y: 323}` — elbow, south side

### 3.3 4-1 High Post Formation

One player at the high post, four perimeter players.

- Point guard (PG / 1): `{x: 370, y: 255}` — top of the key
- Shooting guard (SG / 2): `{x: 330, y: 113}` — wing, north
- Small forward (SF / 3): `{x: 330, y: 398}` — wing, south
- Power forward (PF / 4): `{x: 87, y: 73}` — corner, north
- Center (C / 5): `{x: 280, y: 255}` — high post / free-throw line

### 3.4 Three-Out Two-In (Motion Strong) Formation

Two post players on the blocks, three perimeter players.

- Point guard (PG / 1): `{x: 370, y: 255}` — top of the key
- Shooting guard (SG / 2): `{x: 330, y: 113}` — wing, north
- Small forward (SF / 3): `{x: 330, y: 398}` — wing, south
- Power forward (PF / 4): `{x: 145, y: 188}` — low block, north
- Center (C / 5): `{x: 145, y: 323}` — low block, south

### 3.5 Box Formation (BLOB)

Used for baseline out-of-bounds situations.

- Inbounder (O1): `{x: 30, y: 255}` — behind baseline, centred
- O2: `{x: 190, y: 188}` — elbow, north
- O3: `{x: 190, y: 323}` — elbow, south
- O4: `{x: 122, y: 188}` — block, north
- O5: `{x: 122, y: 323}` — block, south

### 3.6 Stack Formation (BLOB / SLOB)

Players stack vertically near one lane line.

- Inbounder (O1): `{x: 30, y: 255}` — behind baseline
- O2 (nearest to ball): `{x: 145, y: 188}` — block, north
- O3: `{x: 190, y: 188}` — elbow, north
- O4: `{x: 240, y: 188}` — above elbow, north
- O5 (widest): `{x: 87, y: 438}` — opposite corner

### 3.7 SLOB Half-Court Formation

Players spread for sideline inbound near the half-court area.

- Inbounder (O1): `{x: 370, y: 0}` — on sideline, top of canvas
- O2: `{x: 190, y: 188}` — elbow, north
- O3: `{x: 280, y: 255}` — free-throw line
- O4: `{x: 350, y: 398}` — wing, south
- O5: `{x: 145, y: 323}` — block, south

---

## 4. Movement Path Types and Their Canvas Representations

Section summary: This section maps play action types to the StoredPath actionType values in PlayEditorPersistedState, and describes how each movement looks as a coordinate path.

Each path in the PlayEditorPersistedState is a `StoredPath` with these fields:
- `ownerId`: the token id performing the action
- `actionType`: one of `'dribble' | 'pass' | 'cut' | 'screen' | 'dribble-handoff' | 'shoot'`
- `points`: an array of `{x, y}` waypoints tracing the movement on canvas
- `targetId?`: optional id of the receiving token (used for `pass`, `dribble-handoff`)

Action type guidance:

- **dribble**: Ball-handler moves across the court while retaining possession. Points trace the dribble path from start to end.
- **pass**: Ball travels from one token to another. Points start at the passer's position and end at the receiver's position. Set `targetId` to the receiver's token id.
- **cut**: Off-ball player moves without the ball. Points trace the cut path. No `targetId`.
- **screen**: Screener moves to a position and stops to set a screen. Points trace the path to the screen position. No `targetId`.
- **dribble-handoff**: Ball-handler dribbles toward a teammate and hands off. Points trace the dribble path. Set `targetId` to the player receiving the hand-off.
- **shoot**: Ball-handler releases a shot toward the basket. Points go from shooter position toward hoop at `{x: 54, y: 255}`.

---

## 5. Coordinate Usage Rules for Play Generation

Section summary: These rules ensure that LLM-generated plays produce valid, visually coherent PlayEditorPersistedState objects.

- Every phase must include a `ballCarrierId` identifying which token holds the ball.
- Phase 0 (initial formation) defines `tokens` with their starting `position` values — use the formation coordinates from Section 3.
- Each subsequent phase's `playerPositions` must include EVERY token (even stationary ones) — copy unchanged positions from the previous phase; never omit a token.
- Screen paths end at the screen position; the screened player's cut path starts from the same point (showing them using the screen).
- When a pass ends a phase, the next phase begins with the receiver listed as `ballCarrierId`.
- Use the zone pixel ranges from Section 2 to verify that described positions ("wing", "corner", "elbow") map to plausible coordinates before inserting them.
- `courtMode` is always `'half'` for set plays, BLOBs, SLOBs, and ATOs. Use `'full'` only for transition and press plays.
- Minimum spacing between any two offensive tokens in a phase: 80 px (approximately four metres at canvas scale).
