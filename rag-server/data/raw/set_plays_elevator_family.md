# Set Plays — Elevator Family

## 0. CoachDiary Play Generation Rules for ELEVATOR

Section summary: These rules translate Elevator action into CoachDiary's PlayEditorPersistedState format.

**Starting formation tokens:**
- offense-1 (PG): top of key `{x:370, y:255}` — ball-handler and passer
- offense-2 (SG): south block `{x:145, y:323}` — the cutter who runs through the doors
- offense-3 (SF): south corner `{x:87, y:438}` — spacing
- offense-4 (PF): north side of the gap `{x:280, y:210}` — door screener
- offense-5 (C): south side of the gap `{x:280, y:300}` — door screener

**Phase breakdown:**
- Phase 1 — SG cuts through the gap: SG cuts from south block upward through the PF–C gap (actionType: `cut`, path from `{x:145, y:323}` through `{x:280, y:255}` to above the three-point line `{x:370, y:210}`); PF and C hold gap position (playerPositions only — no path in Phase 1, doors are still open).
- Phase 2 — Doors close + catch: PG passes to SG above the arc (actionType: `pass`, targetId: offense-2); PF and C step toward each other to close the doors (update playerPositions: PF moves to `{x:280, y:235}`, C moves to `{x:280, y:275}`); SG's Phase 2 playerPosition is at the catch spot (e.g. `{x:370, y:210}`).
- Phase 3 — Conclusion: SG shoots (actionType: `shoot`, path from catch position toward hoop `{x:54, y:255}`).

**Key rule:** The screeners (PF/C) closing the doors is encoded as a playerPositions update in Phase 2 — NOT as new screen paths. The visual motion is captured by their position changing between Phase 1 and Phase 2.

---

## 1. Elevator Family Overview

Section summary: The Elevator family features two screeners closing like elevator doors on a cutter passing through a gap, producing a wide-open catch-and-shoot opportunity that is extremely difficult to defend because both screeners contact the chasing defender simultaneously.

The Elevator action is a two-screener mechanism where two players stand shoulder-to-shoulder with a gap between them. A cutter runs through the gap; at the moment the cutter clears, both screeners step together, trapping the chasing defender. The cutter emerges on the far side completely open. Because two legal screens contact the defender at the same instant, even the best defensive teams struggle to communicate a solution in real time.

**Elevator is highest-value when:**
- The team has a shooter (SG / 2) with an elite catch-and-shoot percentage.
- The play is used in ATOs (after-timeout situations) where the defence must execute a new coverage in 30 seconds or fewer.
- The screeners (PF / 4 and C / 5) are large enough that closing the gap physically stops the defender.

**Base Elevator starting alignment:**
- Point guard (PG / 1): `{x: 370, y: 255}` — ball-handler at top of the key
- Shooting guard (SG / 2): `{x: 145, y: 323}` — starts below the Elevator (near south block)
- Small forward (SF / 3): `{x: 87, y: 438}` — south corner, spacing
- Power forward (PF / 4): `{x: 280, y: 210}` — one side of the Elevator gap (north)
- Center (C / 5): `{x: 280, y: 300}` — other side of the Elevator gap (south)

---

## 2. ELEVATOR DOORS (Primary Set)

Section summary: ELEVATOR DOORS is the canonical Elevator play — PF and C stand at the free-throw line with a gap between them, SG cuts through the gap from below, and PF and C close the doors at the moment SG clears, freeing SG for a three-point catch-and-shoot at the top of the key.

**Primary option → Counter → Safety valve**

- **Step 1 — Alignment:** Point guard (PG / 1) has the ball at the top of the key (approx. `{x: 370, y: 255}`). Power forward (PF / 4) and center (C / 5) stand shoulder-to-shoulder at the free-throw line area, forming a gap (PF at approx. `{x: 280, y: 210}`, C at approx. `{x: 280, y: 300}`). Shooting guard (SG / 2) starts at the south block (approx. `{x: 145, y: 323}`). Small forward (SF / 3) spaces at the south corner (approx. `{x: 87, y: 438}`).
- **Step 2 — SG cuts through the gap:** SG (2) cuts vertically through the gap between PF (4) and C (5), moving from south block upward toward the three-point arc. Path: SG cut from `{x: 145, y: 323}` through `{x: 280, y: 255}` to `{x: 370, y: 210}` (above the free-throw line, approaching three-point arc).
- **Step 3 — Doors close:** At the exact moment SG (2) passes through the gap, PF (4) and C (5) step toward each other, closing the gap on X2 who is chasing SG. X2 is simultaneously screened by both PF and C.
- **Primary option — SG catches above the arc:** SG (2) emerges above the three-point line (approx. `{x: 370, y: 210}`) completely open. PG (1) delivers the pass. SG catches and shoots a three. Path: PG pass to SG; SG shoot toward hoop `{x: 54, y: 255}`.
- **Counter A — SG rejects, PF or C pops:** If X2 reads the Elevator and goes around the screen, SG (2) can reject the Elevator and cut back down. In this case, PF (4) or C (5) pops to the three-point arc (approx. `{x: 330, y: 113}` or `{x: 330, y: 398}`). PG passes to the open big for a three. Path: PG pass to PF or C; PF/C shoot.
- **Counter B — Lob to C after close:** If both X4 and X5 collapse and leave the basket unguarded while closing the doors, C (5) can skip the door-closing and cut to the basket for a lob from PG.
- **Safety valve:** SF (3) in the south corner (approx. `{x: 87, y: 438}`) receives a pass from PG if no option is available, resetting the offence.

---

## 3. ELEVATOR WING (Side-Entry Variant)

Section summary: ELEVATOR WING repositions the Elevator mechanism from the free-throw line to the wing area, so the cutter emerges in the corner rather than at the top of the key, creating a corner three-point opportunity.

**Primary option → Counter → Safety valve**

- **Step 1 — Entry:** PG (1) passes to SF (3) on the south wing (approx. `{x: 330, y: 398}`). PG relocates to the top of the key (approx. `{x: 370, y: 255}`).
- **Step 2 — Wing Elevator alignment:** PF (4) and C (5) form the Elevator gap on the south wing, parallel to the baseline (PF at approx. `{x: 190, y: 370}`, C at approx. `{x: 190, y: 438}`). SG (2) starts above the Elevator at the wing (approx. `{x: 280, y: 323}`).
- **Step 3 — SG cuts baseline:** SG (2) cuts downward through the PF–C gap toward the baseline, ending in the south corner (approx. `{x: 87, y: 438}`).
- **Step 4 — Doors close:** PF (4) and C (5) close the gap on X2 at the moment SG passes through.
- **Primary option — Corner three:** SF (3) passes to SG (2) in the south corner for a catch-and-shoot three. Path: SF pass to SG; SG shoot.
- **Counter — PF duck-in:** If X4 and X5 both go with their assignments, PF (4) duck-ins to the paint (approx. `{x: 122, y: 323}`) for a post-entry pass from SF. Path: SF pass to PF; PF shoot.
- **Safety valve:** PG (1) at the top (approx. `{x: 370, y: 255}`) — SF reverses to PG to reset.

---

## 4. ELEVATOR ATO (After-Timeout Version)

Section summary: ELEVATOR ATO is a compressed version of ELEVATOR DOORS designed for end-of-clock situations — it has two steps and one immediate read, removing all complexity for high-pressure execution.

**Primary option → Counter → Safety valve**

- **Step 1 — Immediate alignment:** The team receives the inbound or has the ball after the timeout. PF (4) and C (5) get to the free-throw line gap immediately (PF at `{x: 280, y: 210}`, C at `{x: 280, y: 300}`). SG (2) stands below the gap at the south block (approx. `{x: 145, y: 323}`). PG (1) has the ball at the top of the key.
- **Step 2 — SG cuts immediately:** On PG's verbal or visual signal, SG (2) cuts through the gap at maximum speed. Doors close.
- **Primary option — SG three:** PG passes to SG (2) emerging above the arc for the game-winning three. Clock management: initiate with five to six seconds remaining to allow for catch and release.
- **Counter — PG self-create:** If SG is denied even through the Elevator, PG (1) drives off the dribble on the opposite side. The help defenders are all committed to the Elevator action. PG finishes or draws a foul.
- **Safety valve:** Not applicable in an end-of-clock ATO — if no option is available the play has failed; PG takes the best available shot.
