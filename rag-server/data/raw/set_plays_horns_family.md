# Set Plays — HORNS Family

## 0. CoachDiary Play Generation Rules for HORNS

Section summary: These rules translate HORNS tactical descriptions into CoachDiary's PlayEditorPersistedState format — actionType assignments and phase breakdown for every HORNS action.

**Starting formation tokens (Horns set):**
- offense-1 (PG): top of key `{x:370, y:255}` — ball-handler
- offense-2 (SG): corner north `{x:87, y:73}` — spaced shooter
- offense-3 (SF): corner south `{x:87, y:438}` — spaced shooter
- offense-4 (PF): elbow north `{x:190, y:188}` — screener / pop
- offense-5 (C): elbow south `{x:190, y:323}` — screener / roll

**Phase breakdown:**
- Phase 1 — Setup: PG dribbles toward the ball screen (actionType: `dribble`, endpoint immediately behind screen position); screener (C or PF) moves from elbow to screen position (actionType: `screen`, endpoint at screen spot e.g. `{x:230, y:255}`); corner players hold (no path — playerPositions update only).
- Phase 2 — Action: PG drives off the screen (actionType: `dribble`, first waypoint at screen position, endpoint in paint or pull-up spot); rolling screener dives to basket (actionType: `cut`, from screen position to `{x:80, y:255}`); OR PG passes to corner shooter (actionType: `pass`, targetId = corner player).
- Phase 3 — Conclusion (complex plays only): receiver shoots (actionType: `shoot`, points from catch position toward hoop `{x:54, y:255}`).

**Critical check:** PG's Phase 1 final waypoint must be immediately adjacent to the screen position. A ball-handler who stays at `{x:370, y:255}` throughout has NOT used the screen.

---

## 1. HORNS Family Overview

Section summary: The HORNS family places two players at the elbows and two in the corners, with the point guard at the top of the key; every HORNS play exploits the two-man game between the ball-handler and one elbow player, with the other elbow player available as an immediate secondary action.

The HORNS alignment is the most versatile half-court formation in modern basketball because it simultaneously threatens a ball screen, a pick-and-pop, a corner kick, and an isolation action from a single starting position. Before installing HORNS plays, establish:
1. Which elbow player (power forward PF / 4 or center C / 5) is the primary screener.
2. Whether the screener's default tendency is to roll toward the basket or pop to the perimeter.
3. The point guard's (PG / 1) preferred attack direction (left or right).

**Base HORNS alignment pixel coordinates:**
- Point guard (PG / 1): top of the key `{x: 370, y: 255}` — ball-handler, initiates all actions
- Shooting guard (SG / 2): corner north `{x: 87, y: 73}` — spaced shooter
- Small forward (SF / 3): corner south `{x: 87, y: 438}` — spaced shooter
- Power forward (PF / 4): elbow north `{x: 190, y: 188}` — secondary screener / pop
- Center (C / 5): elbow south `{x: 190, y: 323}` — primary screener / roll

---

## 2. HORNS FLAT (Primary Set)

Section summary: HORNS FLAT is the foundation HORNS play — a top-of-the-key ball screen that generates a roll option, a pop option, two corner kick options, and an isolation counter, making it functional against man-to-man, zone, and switching defences.

**Primary option → Counter → Safety valve**

- **Step 1 — Initiation:** Point guard (PG / 1) receives or brings the ball to the top of the key (approx. `{x: 370, y: 255}`). Power forward (PF / 4) and center (C / 5) are at opposite elbows.
- **Step 2 — Wing clear:** Shooting guard (SG / 2) cuts hard to the north corner (approx. `{x: 87, y: 73}`). Small forward (SF / 3) fills the south corner (approx. `{x: 87, y: 438}`). This removes help defenders from the lane.
- **Step 3 — Ball screen:** Center (C / 5) sets a ball screen for point guard (PG / 1) at the top of the key. PG uses the screen and attacks downhill toward the paint.
- **Primary option — C roll:** If C's defender (X5) hedges hard to stop PG's drive, C rolls immediately to the basket (approx. `{x: 90, y: 255}`). PG delivers a bounce pass or lob. PlayEditorPersistedState: PG path = dribble toward paint; C path = cut/roll toward hoop; pass actionType to C.
- **Counter A — Mismatch ISO:** If PG's defender (X1) and C's defender (X5) switch, PG hunts the mismatch — a guard defending a big — in a short isolation action at the elbow.
- **Counter B — Corner kick:** If the defence collapses on PG's drive, PG kicks to the open corner shooter: SG at north corner (approx. `{x: 87, y: 73}`) or SF at south corner (approx. `{x: 87, y: 438}`). Pass actionType; receiver shoots.
- **Counter C — PF pick-and-pop:** If C's defender sags deep to protect the rim, C stops at the elbow (pick-and-pop) and receives PG's pass at approximately `{x: 190, y: 188}` for a mid-range jumper. PF simultaneously screens away for SG.
- **Safety valve:** If no option opens within three seconds of the screen, PG reverses to PF at the opposite elbow (approx. `{x: 190, y: 188}`) for a secondary pick-and-roll or post-entry pass to reset.

**Zone adaptation (HORNS FLAT ZONE):** Against a 2-3 zone, PG (1) and SG (2) occupy the two gaps on either side of the top zone defender (approx. `{x: 330, y: 113}` and `{x: 330, y: 398}`). C receives the ball at the high post between the two zone lines (approx. `{x: 280, y: 255}`), then skips to the corner (SF or SG) exploiting the zone's corner vulnerability.

---

## 3. HORNS QUICK (Immediate Lob Variant)

Section summary: HORNS QUICK is a tempo variant where the point guard does not dribble into the screen — instead the ball screen is set immediately after the inbound and the play targets a lob to the rolling center before the defence can communicate its coverage.

**Primary option → Counter → Safety valve**

- **Step 1 — Early screen:** Center (C / 5) sets the ball screen at the top of the key (approx. `{x: 370, y: 255}`) immediately as PG crosses half-court. No pause before the action.
- **Step 2 — Immediate attack:** Point guard (PG / 1) uses the screen in one fluid motion and attacks the paint at full speed.
- **Primary option — Lob to rolling C:** C rolls hard to the basket (approx. `{x: 90, y: 255}`). PG lofts a lob pass. The speed of the play prevents X5 from setting hedge coverage. Path: PG dribble toward paint → pass (lob) to C at restricted area.
- **Counter — Pop to PF:** If X5 hedges pre-emptively, PF (4) at the opposite elbow (approx. `{x: 190, y: 188}`) pops to the three-point arc (approx. `{x: 330, y: 113}`). PG skips cross-court to PF for a catch-and-shoot three.
- **Safety valve:** SG (2) in the north corner (approx. `{x: 87, y: 73}`) is always available as an escape valve. PG reverses to SG and the offence resets.

---

## 4. HORNS SPLIT (Counter for Switching Defences)

Section summary: HORNS SPLIT runs the standard HORNS ball screen and then triggers an immediate split-action between the two elbow players, designed to punish switching defences that rotate to stop the initial screen-and-roll.

**Primary option → Counter → Safety valve**

- **Step 1 — Standard initiation:** Same as HORNS FLAT: PG (1) at top, PF (4) and C (5) at elbows, SG (2) and SF (3) in corners.
- **Step 2 — Ball screen by C:** C (5) sets the ball screen at the top of the key. The defence switches — X1 takes C (5), X5 takes PG (1).
- **Step 3 — Elbow split triggered:** PF (4), seeing the switch, immediately sets a back-screen on X5 (now guarding PG). PG uses PF's back-screen to attack the basket. Simultaneously, C (5) rolls away from PF's screen toward the opposite block.
- **Primary option — PG drives:** The back-screen from PF creates a clear driving lane for PG. Finish at the rim or draw a foul. Path: PG dribble through the lane toward hoop.
- **Counter — C receives on the block seal:** If PG is still contested, C (5) seals X1 on the opposite block (approx. `{x: 145, y: 323}`). PG passes to C for a post-up. Pass actionType PG to C; C actionType shoot.
- **Counter B — PF pops:** After setting the back-screen, PF (4) pops to the three-point arc (approx. `{x: 330, y: 113}`). If the drive draws both help defenders, PG kicks to PF for an open three.
- **Safety valve:** SF (3) in the south corner (approx. `{x: 87, y: 438}`) is the emergency reset target.

---

## 5. HORNS WEAK (Entry to Opposite Side)

Section summary: HORNS WEAK reverses the ball before the screen action, attacking the weak side of the HORNS alignment to exploit a defence that overloads the initial strong side.

**Primary option → Counter → Safety valve**

- **Step 1 — Ball reversal:** PG (1) dribbles toward the PF (4) side (north elbow, approx. `{x: 190, y: 188}`) and executes a dribble hand-off (DHO) to PF. PG's defender must commit to help side.
- **Step 2 — PF attacks with DHO momentum:** PF receives the DHO and immediately faces up on the north side. C (5) at the south elbow now sets a cross-court ball screen for PF.
- **Primary option — PF uses C screen:** PF drives off C's ball screen from the south elbow (approx. `{x: 190, y: 323}`) toward the paint. C rolls to the basket. Same roll-or-pop read as HORNS FLAT but now run from the opposite elbow.
- **Counter — SG catch-and-shoot:** SG (2) was in the corner. As the DHO draws X1 toward PF, SG cuts from the corner to the wing (approx. `{x: 330, y: 113}`) for a catch-and-shoot three off PF's skip pass.
- **Safety valve:** PG, after the DHO, relocates to the top of the key (approx. `{x: 370, y: 255}`) as the reset outlet.
