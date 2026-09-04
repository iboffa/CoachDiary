# Set Plays — Zone-Specific Attacks

## 1. Attacking Zone Defences — Overview

Section summary: Zone defences are attacked by exploiting the gaps between defenders — the high-post gap in a 2-3 zone, the corner gap in a 2-3 zone, the wing trap gaps in a 1-3-1 zone — using skip passes, high-post entries, and patient ball movement to move the zone and create open shots.

Zone offence differs from man-to-man offence in the following key ways:
- Players attack **gaps between defenders** rather than trying to beat individual defenders.
- **Ball movement precedes player movement** — multiple quick passes shift the zone before a cutter moves.
- The **high post** (free-throw line area, approx. `{x: 280, y: 255}`) is the most dangerous position against a 2-3 zone because it splits the top two defenders and the middle defender.
- **Corner positions** (approx. `{x: 87, y: 73}` and `{x: 87, y: 438}`) are the most dangerous positions against a 2-3 zone because the middle defender (X5) must cover a large horizontal distance to close out.
- Against a 1-3-1 zone, the **baseline** and **opposite corner** are the primary vulnerabilities.

General zone offence principles that apply to all plays below:
- Move the ball faster than the zone can shift — target one-to-two-second pass intervals.
- Attack the zone immediately after it changes shape (after a skip pass the zone is repositioning; that is the moment to attack).
- Use skip passes (long cross-court passes) to move two zone defenders simultaneously.
- Occupy the high post whenever possible to split zone coverage.

---

## 2. Attacking the 2-3 Zone

Section summary: The 2-3 zone is vulnerable at the high post (the gap between the top two defenders and the middle defender) and in the corners; plays in this section systematically attack both weaknesses.

### Play ZONE-23-01: HIGH-LOW ZONE ATTACK

Section summary: HIGH-LOW ZONE ATTACK places the point guard at the high post to receive a wing entry and immediately exploit the 2-3 zone's gap, then delivers a pass to a corner shooter or a post player for a high-percentage shot.

**Primary option → Counter → Safety valve**

- **Step 1 — Alignment vs. 2-3 zone:** Use a 3-2 offensive alignment — three players across the top of the arc and two players in the corners.
  - Point guard (PG / 1): top of the key `{x: 370, y: 255}` — primary ball-handler
  - Shooting guard (SG / 2): north wing `{x: 330, y: 113}` — wing threat
  - Small forward (SF / 3): south wing `{x: 330, y: 398}` — wing threat
  - Power forward (PF / 4): north corner `{x: 87, y: 73}` — corner shooter
  - Center (C / 5): high post `{x: 280, y: 255}` — hub player, seals the gap

- **Step 2 — Wing entry to create zone movement:** PG (1) passes to SG (2) on the north wing. The zone's top defender (X1) follows the ball; the north wing defender (X3) closes out on SG. One zone defender is now out of position.

- **Step 3 — High-post entry:** SG (2) passes to C (5) at the high post (approx. `{x: 280, y: 255}`). This is the most critical pass in the sequence. C (5) is in the gap between the two top zone defenders. X5 (the middle zone defender) must step up to guard C.

- **Primary option — Skip to north corner:** With X5 stepping up to guard C (5), the north corner is vacated. C (5) immediately skips to PF (4) at the north corner (approx. `{x: 87, y: 73}`) for a catch-and-shoot three. Path: C pass to PF; PF shoot.

- **Counter — Low-post entry (C dribbles baseline):** If X5 stays back, C (5) drives baseline from the high post and either finishes at the rim or delivers a dump-off to PF (4) or SF (3) cutting to the south block. Path: C dribble toward paint; pass or shoot.

- **Counter B — Skip to south corner:** If X3 (zone wing defender) collapses on C's high-post reception, C (5) skips to SF (3) who has drifted from the south wing to the south corner (approx. `{x: 87, y: 438}`). Path: C skip pass to SF; SF shoot.

- **Safety valve:** PG (1) at the top of the key (approx. `{x: 370, y: 255}`) receives a reversal from SG or C to reset the attack and restart ball movement.

---

### Play ZONE-23-02: OVERLOAD CORNER ATTACK

Section summary: OVERLOAD CORNER ATTACK floods one side of the 2-3 zone with three players, forcing the zone to rotate and leaving either a skip-pass three or a post-entry opportunity on the opposite side.

**Primary option → Counter → Safety valve**

- **Step 1 — Overload alignment:** PG (1) at the top `{x: 370, y: 255}`. SG (2) at the north wing `{x: 330, y: 113}`. PF (4) at the north short corner `{x: 107, y: 155}`. C (5) at the north corner `{x: 87, y: 73}`. SF (3) at the south corner `{x: 87, y: 438}`. Three players (SG, PF, C) are on the north side; the zone must decide how to cover three players with two (X3 and X5).

- **Step 2 — Wing-to-short-corner ball movement:** PG (1) passes to SG (2) on the north wing. SG (2) quickly passes to PF (4) at the north short corner. Two rapid passes shift the zone.

- **Step 3 — Read the zone:** PF (4) reads which defender covers the north corner (C / 5):
  - If X5 (middle defender) steps out to cover C (5): the paint is empty. PF passes to C (5) in the corner for a three, or PF drives baseline to the paint.
  - If X3 (wing defender) covers C (5): SG (2) is open on the wing. PF reverses to SG.

- **Primary option — C corner three:** PF (4) passes to C (5) at the north corner (approx. `{x: 87, y: 73}`) for a catch-and-shoot three. Path: PF pass to C; C shoot.

- **Counter — SF skip opposite:** With the entire zone shifted north, PG (1) calls a skip pass over the defence to SF (3) at the south corner (approx. `{x: 87, y: 438}`). The zone cannot recover in time. Path: PF or SG pass back to PG; PG skip to SF; SF shoot.

- **Counter B — Paint attack:** If neither corner is open, PF (4) drives baseline from the short corner directly to the basket (approx. `{x: 90, y: 255}`) while the zone is stretched. Path: PF dribble to hoop; shoot.

- **Safety valve:** PG (1) reverses the ball from north to south to reset and restart the overload from the opposite side.

---

### Play ZONE-23-03: HORNS ZONE SET

Section summary: HORNS ZONE SET adapts the HORNS alignment to attack a 2-3 zone by placing the two elbow players (PF and C) at the gaps between zone lines where they can receive the ball and threaten the zone from inside.

**Primary option → Counter → Safety valve**

- **Step 1 — HORNS vs. zone alignment:** PG (1) at top `{x: 370, y: 255}`. PF (4) at north elbow `{x: 190, y: 188}` — positioned in the gap between X1 and X3. C (5) at south elbow `{x: 190, y: 323}` — in the gap between X2 and X5. SG (2) north corner `{x: 87, y: 73}`. SF (3) south corner `{x: 87, y: 438}`.

- **Step 2 — PG passes to C (5) at the south elbow:** C (5) is in the zone gap. X5 must step up; X2 must close. Simultaneously, the south corner (SF / 3) is vacated by X5's movement.

- **Primary option — C passes to SF in south corner:** C (5) immediately skips to SF (3) at the south corner (approx. `{x: 87, y: 438}`) for a catch-and-shoot three. The skip pass beats the retreating X5. Path: PG pass to C; C pass to SF; SF shoot.

- **Counter — PF high-low:** If the south corner is covered, C (5) holds the ball and looks cross-court to PF (4) at the north elbow. PF (4) then delivers a post entry to SG (2) who has cut from the north corner to the north block. Path: C pass to PF; PF post entry to SG.

- **Counter B — C mid-range:** If both corners are covered and the high-low is clogged, C (5) turns and shoots a mid-range jumper from the elbow (approx. `{x: 190, y: 323}`). Zone defenders will be in awkward positions unable to close out effectively.

- **Safety valve:** PG (1) stays at the top to receive a reversal and restart the sequence from the other elbow.

---

## 3. Attacking the 1-3-1 Zone

Section summary: The 1-3-1 zone is most vulnerable in the corners and along the baseline — the baseline defender (X5) must cover both corners, which is impossible; plays in this section attack both corners simultaneously or use the baseline drive to force the baseline defender to commit before passing to the open corner.

### Play ZONE-131-01: CORNER FLOOD ATTACK

Section summary: CORNER FLOOD ATTACK sends two players simultaneously to opposite corners, forcing the 1-3-1 baseline defender (X5) to choose which corner to cover, leaving one player open for a corner three.

**Primary option → Counter → Safety valve**

- **Step 1 — Alignment vs. 1-3-1:** Point guard (PG / 1) at top `{x: 370, y: 255}`. Shooting guard (SG / 2) at the north wing `{x: 330, y: 113}`. Small forward (SF / 3) at the south wing `{x: 330, y: 398}`. Center (C / 5) at the high post `{x: 280, y: 255}` — in the middle of the 1-3-1 to receive high-post passes. Power forward (PF / 4) at the south corner `{x: 87, y: 438}`.

- **Step 2 — Wing entry:** PG (1) passes to SG (2) on the north wing. X2 (the 1-3-1 wing defender) closes out on SG. The north side of the 1-3-1 is now occupied.

- **Step 3 — High-post entry:** SG (2) passes to C (5) at the high post. C (5) is in the heart of the 1-3-1 between the three middle defenders. All three middle defenders must respect C.

- **Step 4 — Simultaneous corner flood:** Simultaneously, PG (1) cuts from the top to the north corner (approx. `{x: 87, y: 73}`). PF (4) is already in the south corner (approx. `{x: 87, y: 438}`). X5 (the 1-3-1 baseline defender) cannot cover both corners.

- **Primary option — C reads and passes to the open corner:** C (5) delivers a skip pass to whichever corner (PG at north or PF at south) X5 is not covering. Path: C pass to PG or PF; receiver shoots three.

- **Counter — C attacks off the dribble:** If neither corner is immediately open (X5 splits both corners by positioning centrally), C (5) drives from the high post directly to the basket (approx. `{x: 90, y: 255}`) before X5 can recover. The entire 1-3-1 is caught behind the drive.

- **Counter B — Wing re-attack:** If C (5) encounters traffic on the drive, C passes to SG (2) at the north wing who has stepped behind X2 for an open three.

- **Safety valve:** SF (3) at the south wing (approx. `{x: 330, y: 398}`) receives a reset pass from C (5) to restart ball movement.

---

### Play ZONE-131-02: BASELINE DRIVE ATTACK

Section summary: BASELINE DRIVE ATTACK uses a player positioned at the baseline to drive across the lane, forcing the 1-3-1 baseline defender (X5) to commit, then passes back to the opposite corner for an open three.

**Primary option → Counter → Safety valve**

- **Step 1 — Setup:** PG (1) at top `{x: 370, y: 255}`. SG (2) on the north wing `{x: 330, y: 113}`. SF (3) receives and holds position at the south short corner (approx. `{x: 107, y: 383}`). PF (4) at the north corner `{x: 87, y: 73}`. C (5) at the high post `{x: 280, y: 255}`.

- **Step 2 — Ball into the south short corner:** PG (1) passes to SG (2). SG passes to SF (3) at the south short corner (approx. `{x: 107, y: 383}`). X5 (the baseline defender) must close out on SF.

- **Step 3 — Baseline drive:** SF (3) drives baseline from the south short corner toward the south block and paint (approx. `{x: 90, y: 323}`). X5 commits to stopping the drive.

- **Primary option — Kick to north corner:** With X5 committed to SF's drive, PF (4) at the north corner (approx. `{x: 87, y: 73}`) is completely unguarded. SF (3) delivers a pass to PF for a catch-and-shoot three. Path: SF pass to PF; PF shoot.

- **Counter — SF finishes at the rim:** If X5 fails to commit and leaves the paint open, SF (3) continues the baseline drive all the way to the basket (approx. `{x: 90, y: 255}`) for a layup or contact finish.

- **Counter B — High-post dump-off:** If X5 overcommits toward the drive and the corner is contested, SF passes back to C (5) at the high post who catches with a clear look at the free-throw line jumper.

- **Safety valve:** PG (1) calls for the ball from the top and SF reverses to reset the 1-3-1 attack from the other wing.
