# Set Plays — Floppy Family

## 0. CoachDiary Play Generation Rules for FLOPPY

Section summary: These rules translate Floppy tactical descriptions into CoachDiary's PlayEditorPersistedState format.

**Starting formation tokens:**
- offense-1 (PG): top of key `{x:370, y:255}` — initiates with entry pass to SF
- offense-2 (SG): mid-paint `{x:122, y:255}` — the shooter who uses the screens
- offense-3 (SF): wing south `{x:330, y:398}` — receives entry pass, becomes the passer
- offense-4 (PF): south block `{x:145, y:323}` — south screen in the double pin-down
- offense-5 (C): north block `{x:145, y:188}` — north screen in the double pin-down

**Phase breakdown:**
- Phase 1 — Entry + screens: PG passes to SF on wing (actionType: `pass`, targetId: offense-3); PF and C set pin-down screens facing outward (actionType: `screen`; PF endpoint `{x:145, y:323}`, C endpoint `{x:145, y:188}`); SG begins reading and cutting (actionType: `cut`, start `{x:122, y:255}`).
- Phase 2 — Main action: SG completes cut to wing or corner (SG's new position in playerPositions); SF passes to SG at the open spot (actionType: `pass`, targetId: offense-2); OR SF enters post to a sealing big (actionType: `pass`, targetId: offense-4 or offense-5).
- Phase 3 — Conclusion: SG shoots (actionType: `shoot`, points from catch position toward hoop `{x:54, y:255}`).

**Screen direction rule:** PF screens south (toward baseline); C screens north (toward the arc). SG reads which screen is more open and cuts accordingly. Do not send SG through both screens in the same path.

---

## 1. Floppy Family Overview

Section summary: The Floppy family frees a designated shooter off a double pin-down screen at the low block; the shooter reads the defensive coverage and cuts in the direction that gives them the cleanest catch-and-shoot opportunity.

The Floppy is one of the most reliable shooter-liberation plays in organised basketball. The name comes from the shooter's ability to "flop" — cut in either direction — off the double screen depending on how the defence plays them. Two bigs (power forward PF / 4 and center C / 5) set back-to-back pin-down screens at the low block. The shooter (usually shooting guard SG / 2) reads both screens and chooses their cut. Because the cutter has two options, the defence cannot fully commit to either.

**Floppy is highest-value when:**
- The team has a designated catch-and-shoot scorer (high three-point percentage).
- The opposition plays aggressive man-to-man denial on the shooter.
- The team needs a play that generates catch-and-shoot threes reliably under pressure.

**Base Floppy starting alignment pixel coordinates:**
- Point guard (PG / 1): top of the key `{x: 370, y: 255}` — ball-handler, initiates with an entry pass
- Shooting guard (SG / 2): starts in the mid-paint `{x: 122, y: 255}` — the designated shooter
- Small forward (SF / 3): wing south `{x: 330, y: 398}` — secondary ball-handler / reset option
- Power forward (PF / 4): mid-paint south `{x: 145, y: 323}` — first screen in the double
- Center (C / 5): low block north `{x: 145, y: 188}` — second screen in the double

---

## 2. FLOPPY STANDARD (Primary Set)

Section summary: FLOPPY STANDARD is the canonical Floppy play — PG passes to SF on the wing, then two bigs set staggered pin-down screens at the lane for SG, who cuts to whichever side is open.

**Primary option → Counter → Safety valve**

- **Step 1 — Wing entry:** Point guard (PG / 1) passes to small forward (SF / 3) on the wing (approx. `{x: 330, y: 398}`). PG relocates to the top of the key (approx. `{x: 370, y: 255}`) as the safety valve.
- **Step 2 — Floppy screens set:** Center (C / 5) moves to the north low block (approx. `{x: 145, y: 188}`). Power forward (PF / 4) positions at the south block (approx. `{x: 145, y: 323}`). Both set pin-down screens facing outward — C's screen faces north/top of the key; PF's screen faces south/baseline.
- **Step 3 — SG reads the defence:** Shooting guard (SG / 2) starts at the mid-paint and reads X2's position:
  - If X2 is trailing (chasing SG from behind): SG curls toward the elbow using C's north screen (north cut, approx. `{x: 190, y: 188}` to wing north `{x: 330, y: 113}`).
  - If X2 is anticipating and taking away the north cut: SG rejects C's screen and cuts the opposite direction, using PF's south screen toward the corner (approx. `{x: 87, y: 438}`).
- **Primary option — Curl cut to wing:** SG uses C's north screen and curls to the north wing (approx. `{x: 330, y: 113}`). SF (3) delivers a pass to SG for a catch-and-shoot three. Path: SG cut north; SF pass to SG; SG shoot.
- **Counter — Flare cut to corner:** SG reads X2 cheating high and flops south, using PF's screen to reach the south corner (approx. `{x: 87, y: 438}`). SF skips south to SG for a corner three. Pass actionType SF to SG; SG shoot.
- **Counter B — PF/C seal post:** When both screens are set and the defence locks SG, C (5) or PF (4) may find their defender sealed on their back. SF (3) enters the post to whichever big has the better seal. Pass actionType SF to PF or C.
- **Safety valve:** PG (1) at the top of the key (approx. `{x: 370, y: 255}`) receives a pass from SF to reset the possession.

---

## 3. FLOPPY DOUBLE (Both Cutters Activate)

Section summary: FLOPPY DOUBLE sends two players through the Floppy screens simultaneously — the primary shooter and a secondary cutter — so the defence must account for two threats from the same action.

**Primary option → Counter → Safety valve**

- **Step 1 — Wing entry:** Same as FLOPPY STANDARD — PG (1) enters to SF (3) on the wing.
- **Step 2 — Double floppy:** SG (2) and PF (4) both use C (5)'s screen almost simultaneously. SG (2) cuts first; PF (4) cuts one beat later from the opposite direction.
- **Primary option — SG open first:** SF (3) passes to whichever cutter (SG or PF) creates the first open look. If SG (2) cuts to the wing (approx. `{x: 330, y: 113}`) and X2 is trailing: SF hits SG for the three.
- **Counter — PF open off second cut:** If X4 was helping to stop SG's cut, PF (4) slips behind X4 and catches at the elbow north (approx. `{x: 190, y: 188}`) for a mid-range jumper. Pass actionType SF to PF; PF shoot.
- **Counter B — C duck-in:** C (5), after setting the double screen, finds X5 pinned behind them. C ducks into the paint (approx. `{x: 122, y: 255}`) for a duck-in catch. Pass SF to C.
- **Safety valve:** PG (1) at the top (approx. `{x: 370, y: 255}`) is always available for SF to reset.

---

## 4. FLOPPY HORNS ENTRY (Combined HORNS + Floppy)

Section summary: FLOPPY HORNS ENTRY initiates from the HORNS alignment and transitions into the Floppy screens after a ball reversal, confusing defences that key on the HORNS action.

**Primary option → Counter → Safety valve**

- **Step 1 — HORNS initiation:** PG (1) at top `{x: 370, y: 255}`, PF (4) at north elbow `{x: 190, y: 188}`, C (5) at south elbow `{x: 190, y: 323}`, SG (2) at north corner `{x: 87, y: 73}`, SF (3) at south corner `{x: 87, y: 438}`.
- **Step 2 — Fake P&R, reverse:** PG fakes a ball screen with C (5), drawing the defence's attention to the pick-and-roll side. PG reverses the ball to PF (4) at the north elbow.
- **Step 3 — Floppy transition:** C (5) and SG (2) immediately set and use the Floppy double screen on the south side. PF (4) now has the ball and serves as the passer.
- **Primary option:** SF (3) cuts off SG (2)'s screen to the south wing (approx. `{x: 330, y: 398}`). PF (4) passes to SF for a catch-and-shoot three. Path: PF pass to SF; SF shoot.
- **Counter — SG open on opposite side:** If X3 overplays SF, SG (2) flops to the north wing (approx. `{x: 330, y: 113}`) for a kick-out three. Pass PF to SG.
- **Counter B — PF self-creates:** If the entire defence rotates toward the Floppy action, PF (4) attacks off the dribble from the elbow against a temporarily vacated lane.
- **Safety valve:** PG (1) relocates to the top of the key (approx. `{x: 370, y: 255}`) for PF to reverse and reset.
