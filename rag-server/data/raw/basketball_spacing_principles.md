# Basketball Spacing Principles — CoachDiary Play Generation Reference

## 1. Why Spacing Matters

Section summary: Proper spacing is the foundation of all offensive basketball. Without it, plays collapse before they start.

Good spacing achieves three things simultaneously:
1. **Opens driving lanes** — defenders cannot help without abandoning an open shooter.
2. **Creates passing angles** — the ball can travel to any spot on the floor without being deflected.
3. **Forces the defence to cover the whole court** — one defensive rotation leaves someone open.

Poor spacing (players clustered in small areas) does the opposite: defenders can guard two players at once, passing lanes are crowded, and cuts have nowhere to go.

The NBA rule of thumb: **every offensive player should be able to see every teammate without turning more than 90 degrees**. On the CoachDiary half-court canvas (570 × 510 px), this translates to a minimum separation of **80 px between any two players** at all times.

---

## 2. The Five-Out Principle

Section summary: Five-out spacing is the gold standard for modern half-court offences.

Five-out (also called "open post") places all five offensive players on or beyond the three-point arc:

| Player | Position | Canvas coordinates |
|--------|----------|--------------------|
| PG (1) | Top of key | x=370, y=255 |
| SG (2) | Wing north | x=330, y=113 |
| SF (3) | Wing south | x=330, y=398 |
| PF (4) | Corner north | x=87, y=73 |
| C  (5) | Corner south | x=87, y=438 |

**Why these coordinates?** The arc on this canvas sits roughly at x=90–370. Placing players at x≥87 on the perimeter and x=330–370 at the wings/top ensures no one is inside the paint when they should be a spacing threat.

Five-out rules:
- The entire paint is empty — any dribble penetration has a clear lane.
- Corner players (x≈87) are the pressure release: skip passes punish aggressive help defence.
- Wing players (x≈330) are the intermediate relay: one pass away from the ball-handler.
- The ball-handler (x=370) is at the top, one pass from both wings.

---

## 3. Formation-Specific Spacing Rules

Section summary: Different formations have different spacing requirements, but all share the 80 px minimum separation rule.

### 3.1 Horns

Two players at the elbows (x=190), two in corners (x=87), one at the top (x=370).

| Player | Zone | Coordinates |
|--------|------|-------------|
| PG (1) | Top of key | x=370, y=255 |
| SG (2) | Corner north | x=87, y=73 |
| SF (3) | Corner south | x=87, y=438 |
| PF (4) | Elbow north | x=190, y=188 |
| C  (5) | Elbow south | x=190, y=323 |

Spacing check: PG↔PF = 235 px ✓; PF↔C = 135 px ✓; elbow↔corner = ~120 px ✓.

### 3.2 Four-Out One-In

One post player in the paint, four on the perimeter. The post player occupies a **block** (x=145), not the paint centre (x=122), so perimeter cuts still have room.

| Player | Zone | Coordinates |
|--------|------|-------------|
| PG (1) | Top of key | x=370, y=255 |
| SG (2) | Wing north | x=330, y=113 |
| SF (3) | Wing south | x=330, y=398 |
| PF (4) | Corner north | x=87, y=73 |
| C  (5) | Low block south | x=145, y=323 |

The post (C) at x=145 is far enough from the corner (PF) to keep the lane usable.

### 3.3 Three-Out Two-In

Two post players on opposite blocks; three perimeter players. The posts must be on **opposite** sides (north block x=145 y=188, south block x=145 y=323) — never both on the same side.

---

## 4. Minimum Spacing Rules (Hard Constraints)

Section summary: These are non-negotiable distance constraints that every generated play must satisfy, with narrow exceptions for deliberate screen actions.

1. **80 px minimum** between any two offensive tokens at their starting position and at every destination point in every phase — **except** for players actively performing a gate screen or stagger screen (see Section 4.1 below).
2. **Perimeter players stay at x ≥ 85** unless executing a cut into the paint. A player whose role is spacing should never drift inside x=85 at rest.
3. **At most one player in the paint** at any given moment (for five-out and four-out sets). Two players in the paint simultaneously kills all driving lanes.
4. **Corner players (x≈87) must be separated by at least 300 px on the y-axis** to occupy opposite corners (y≈73 and y≈438).
5. **Elbow players (x≈190) must be separated by at least 100 px on the y-axis** (north y≈188, south y≈323).
6. **Wing players (x≈330) must be separated by at least 200 px on the y-axis** (north y≈113, south y≈398).

### 4.1 Screen-Type Exceptions to the 80 px Rule

**Gate screen (double screen, side-by-side):**
A gate screen intentionally places two screeners shoulder-to-shoulder so a cutter can run through or around them. The two screeners will be closer than 80 px by design. Minimum screener-to-screener separation for a gate is **40 px** (roughly one player body-width). All other players remain ≥ 80 px from each screener.

Typical gate placement examples:
- High gate (free-throw line area): screener A at x=280, y=215 and screener B at x=280, y=295 — separation 80 px on y, gate gap ≈ 80 px (wide gate).
- Tight gate: screener A at x=190, y=228 and screener B at x=190, y=282 — separation ~54 px (narrow gate, forces cutter to one side).
- Low gate (block area): screener A at x=145, y=218 and screener B at x=145, y=292.

**Stagger screen (double screen, sequential):**
Two screeners set screens one after the other along the cutter's path. Screeners are placed at **different x-values** (different depths), so they are naturally well-separated. No exception to the 80 px rule is needed — stagger screeners should always be ≥ 80 px apart.

Typical stagger placement:
- First screener (deeper): x=145, y=323 (low block south)
- Second screener (higher): x=190, y=188 (elbow north)
- Cutter runs past both in sequence

**Rule of thumb:** If two players are both tagged as screeners and their paths both end at the same x with y-values within 80 px of each other, they are a gate pair — this is intentional and valid. If only one player is a screener, the 80 px rule applies normally.

---

## 5. Common Spacing Mistakes to Avoid

Section summary: These are the most frequent errors in AI-generated plays and how to correct them.

| Mistake | Effect | Correction |
|---------|--------|------------|
| PG placed at x=285–310 | Too close to the paint, kills penetration angles | Move to x=370 (top of key) |
| Wings placed at x=200–220 | Inside the arc, defenders can sag off | Move to x=330 (wing zone) |
| Two players on the same side at similar y | Defensive crowding, no spacing | Separate by at least 80 px on y-axis |
| Post player at paint centre (x=122) at rest | Blocks all driving lanes | Rest on the block (x=145) or high post (x=280) |
| Corner and wing on the same side within 80 px | One defender covers both | Ensure y-axis separation ≥ 80 px |
| All five players between x=120 and x=250 | Entire offence crammed in the mid-range | Spread to the arc (x=87 corners, x=330 wings, x=370 top) |

---

## 6. Spacing During Movement (Phase Rules)

Section summary: Spacing must be maintained not just at the start of a play but throughout every phase.

- When a player **cuts through the paint**, their starting and ending positions must both satisfy the 80 px rule with all stationary teammates.
- When a player **sets a screen**, the screener stops at a position that does not crowd the ball-handler or a cutter. Screener and ball-handler should not overlap.
- When a player **relocates** (fills a vacated spot), they move to the spot the cutter left — maintaining floor balance. No two players should chase the same empty zone.
- **Ball movement creates spacing** — as the ball shifts from top to wing, the opposite wing should drift toward the corner to open the strong-side driving lane.

---

## 7. Zone Reference Table

Section summary: Quick-reference canonical coordinates for every named zone on the CoachDiary canvas.

| Zone name | x | y | Notes |
|-----------|---|---|-------|
| Top of key | 370 | 255 | Ball-handler default |
| Wing north | 330 | 113 | Above the break, north |
| Wing south | 330 | 398 | Above the break, south |
| Corner north | 87 | 73 | Below the break, north |
| Corner south | 87 | 438 | Below the break, south |
| Elbow north | 190 | 188 | Top of the lane, north |
| Elbow south | 190 | 323 | Top of the lane, south |
| Low block north | 145 | 188 | Block, north side |
| Low block south | 145 | 323 | Block, south side |
| High post / FT line | 280 | 255 | Centre of free-throw line |
| Short corner north | 107 | 128 | Inside the arc, north |
| Short corner south | 107 | 383 | Inside the arc, south |
| Paint centre | 122 | 255 | Mid-paint (avoid at rest) |
