# Set Plays — DHO (Dribble Hand-Off) Family

## 0. CoachDiary Play Generation Rules for DHO

Section summary: These rules translate DHO tactical descriptions into CoachDiary's PlayEditorPersistedState format.

**Key actionType:** Use `dribble-handoff` for the dribbler's path when handing to a teammate. Set `targetId` to the receiving player's id. The receiver's approach cut is actionType: `cut`.

**Phase breakdown (standard DHO):**
- Phase 1 — Approach: dribbler moves toward receiver (actionType: `dribble-handoff`, targetId: receiver, endpoint at hand-off position); receiver cuts toward dribbler (actionType: `cut`, endpoint at same hand-off position); off-ball players hold spacing (playerPositions update, no path needed).
- Phase 2 — After hand-off: receiver attacks with DHO momentum (actionType: `dribble`, first waypoint at hand-off position, endpoint at paint entry or pull-up spot); dribbler rolls to basket or pops (actionType: `cut` to `{x:80, y:255}` for roll; playerPositions update for pop — no path needed).
- Phase 3 — Conclusion: receiver shoots (actionType: `shoot`) or passes to open corner (actionType: `pass`, targetId: corner player).

**Critical check:** The receiver's Phase 2 dribble path must START at the hand-off position (the dribbler's Phase 1 final waypoint). The ball does not teleport between phases.

---

## 1. DHO Family Overview

Section summary: The DHO family uses dribble hand-offs as pseudo-screens to create defensive confusion — because the hand-off is a live dribble, defenders cannot go under or over it the same way they defend a static screen, making DHO plays particularly effective against switching and aggressive-over-screen defences.

DHO = Dribble Hand-Off. One player dribbles toward a teammate, who cuts toward the ball and accepts the hand-off while in motion. The defender of the receiving player must decide whether to go over the dribbler (fighting through a moving screen), go under (surrendering the catch-and-shoot), or switch (creating a possible mismatch). Each defensive response has a corresponding counter built into the plays below.

**DHO plays are highest-value when:**
- The receiving player has a strong catch-and-shoot or one-dribble pull-up game.
- The dribbler has court vision to execute the hand-off and immediately make the next pass or screen.
- The defence switches aggressively — DHO actions create mismatches more reliably than static screens against switching teams.

**General DHO alignment conventions:**
- The dribbler (usually C / 5 or PF / 4) sets up at the high post (approx. `{x: 280, y: 255}`) or the elbow (approx. `{x: 190, y: 188}` or `{x: 190, y: 323}`).
- The receiver (usually PG / 1 or SG / 2) cuts from the wing or corner toward the dribbler.
- After the hand-off, the dribbler's next action (roll, pop, re-screen) determines which counter is triggered.

---

## 2. DHO TWIST (Double Hand-Off Set)

Section summary: DHO TWIST runs two sequential hand-offs in opposite directions so that the defence must make two independent correct decisions; a mistake on either gives the offence a high-percentage attack.

**Primary option → Counter → Safety valve**

- **Step 1 — Initiation:** Center (C / 5) starts at the top of the key with the ball (approx. `{x: 370, y: 255}`). Point guard (PG / 1) is on the north wing (approx. `{x: 330, y: 113}`). Shooting guard (SG / 2) is at the south elbow (approx. `{x: 190, y: 323}`). Small forward (SF / 3) and power forward (PF / 4) space to the corners.
- **Step 2 — First DHO (fake):** C (5) dribbles toward PG (1) on the north wing and offers the hand-off. PG (1) rejects the hand-off and cuts backdoor toward the basket (approx. `{x: 90, y: 113}`). C (5) continues dribbling south toward SG (2).
- **Step 3 — Second DHO (real):** C (5) executes a real hand-off with SG (2) coming off the south elbow (approx. `{x: 190, y: 323}`). SG (2) catches with momentum toward the lane. X2, who just watched the PG rejection, is a beat slow to recover on SG.
- **Primary option — SG attacks off DHO:** SG (2) catches the second hand-off and attacks the paint in one dribble. The half-step advantage from the hand-off momentum creates a driving lane. Path: SG dribble toward paint; shoot or finish.
- **Counter A — PG lob (backdoor):** If X2 fully commits to stopping SG (2)'s drive, PG (1) is wide open on the backdoor cut (approx. `{x: 90, y: 113}`). C (5) lofts the pass to PG before completing the second DHO. Path: C pass to PG; PG finish.
- **Counter B — C rolls to basket:** If both X1 and X2 collapse on SG (2)'s drive, C (5) rolls to the basket (approx. `{x: 90, y: 255}`) after completing the second DHO for a dump-off. Path: SG pass to C; C finish.
- **Safety valve:** PF (4) in the corner (approx. `{x: 87, y: 438}`) receives a kick-out from SG (2) if the lane is locked. SG pass to PF; PF shoot three.

---

## 3. DHO HAMMER (Misdirection Variant)

Section summary: DHO HAMMER uses the DHO as misdirection to hide a back-screen on the corner shooter's defender — the real target is the corner three-pointer, not the DHO cutter.

**Primary option → Counter → Safety valve**

- **Step 1 — Setup:** Point guard (PG / 1) is on the north wing (approx. `{x: 330, y: 113}`) with the ball. Center (C / 5) is at the north elbow (approx. `{x: 190, y: 188}`). Small forward (SF / 3) is in the south corner (approx. `{x: 87, y: 438}`). Power forward (PF / 4) is at the south block (approx. `{x: 145, y: 323}`). Shooting guard (SG / 2) spaces to the top of the key (approx. `{x: 370, y: 255}`).
- **Step 2 — DHO fake / misdirection:** PG (1) dribbles toward C (5) and simulates a DHO. X3 (guarding SF in the corner) watches the DHO action and loses track of SF (3).
- **Step 3 — Back-screen on X3:** PF (4) sets a hard back-screen on X3 (who is ball-watching at approx. `{x: 145, y: 380}`). SF (3) cuts from the south corner around PF's screen toward the north corner (approx. `{x: 87, y: 73}`).
- **Primary option — SF corner three:** C (5) receives PG's DHO pass and immediately fires a skip pass to SF (3) running into the north corner for a catch-and-shoot three. Path: PG pass/DHO to C; C pass to SF; SF shoot.
- **Counter A — C mid-range:** If X3 correctly navigates the back-screen and SF (3) is not open, C (5) catches the ball at the north elbow (approx. `{x: 190, y: 188}`) and takes the mid-range jumper. Path: PG pass to C; C shoot.
- **Counter B — PG attacks off the DHO:** If X1 over-commits toward the DHO action to help, PG (1) rejects the DHO and drives the vacated lane off the dribble. Path: PG dribble to paint; shoot or finish.
- **Safety valve:** SG (2) at the top of the key (approx. `{x: 370, y: 255}`) receives a pass from PG to reset.

---

## 4. DHO LOOP (Sequential DHO Chain)

Section summary: DHO LOOP chains three consecutive hand-offs across the top of the key, each time advancing the ball to a new player; the accumulated defensive repositioning creates an open look on the third hand-off or a drive for the final ball-handler.

**Primary option → Counter → Safety valve**

- **Step 1 — Three-player alignment at the top:** PG (1) has the ball at the top of the key (approx. `{x: 370, y: 255}`). C (5) is at the north elbow (approx. `{x: 190, y: 188}`). PF (4) is at the south elbow (approx. `{x: 190, y: 323}`). SG (2) and SF (3) space to the corners.
- **Step 2 — First DHO:** PG (1) dribbles toward C (5) at the north elbow and hands off. C receives with momentum pointing north-wing direction.
- **Step 3 — Second DHO:** C (5) immediately dribbles toward the top of the key and meets PF (4) coming up from the south elbow. C hands off to PF, who catches moving north.
- **Step 4 — Third DHO (final action):** PF (4) dribbles toward SG (2) cutting from the south corner and executes a final hand-off. SG (2) catches with maximum momentum toward the paint.
- **Primary option — SG attacks the lane:** SG (2) uses the third DHO momentum to attack the lane off one dribble. X2 has been moving through three separate DHO actions and is disoriented. Path: SG dribble toward paint; finish.
- **Counter — C or PF rolls:** If SG (2) draws multiple defenders, either C (5) or PF (4) (whichever set the most recent DHO) rolls to the basket. SG passes to the roller. Path: SG pass to C or PF; finish.
- **Counter B — Kick to corner shooter:** If the lane collapses, SG (2) kicks to SF (3) in the south corner (approx. `{x: 87, y: 438}`) for an open three.
- **Safety valve:** PG (1), after setting the first DHO, relocates to the top of the key (approx. `{x: 370, y: 255}`) as the reset target for any player who needs to reverse.

---

## 5. DHO DRAG (Transition DHO)

Section summary: DHO DRAG is a transition-triggered DHO where the center sprints ahead of the defence and meets the point guard at the top of the key for an immediate hand-off before the defence can set, creating a fast-break lay-up or a mid-range pull-up.

**Primary option → Counter → Safety valve**

- **Step 1 — Trigger:** After a defensive rebound or turnover, C (5) sprints ahead in transition and arrives at the top of the key (approx. `{x: 370, y: 255}`) before X5 has retreated. PG (1) pushes the ball up the middle.
- **Step 2 — DHO at top of the key:** PG (1) and C (5) meet at the top of the key for an immediate hand-off. C's defender is still retreating.
- **Primary option — PG attacks the open lane:** PG (1) receives the DHO from C (5) and drives the lane with a one-step advantage over the transitioning X5. Finish at the rim. Path: DHO from C to PG; PG dribble to hoop `{x: 54, y: 255}`; shoot.
- **Counter — C keeps ball, drives:** If PG (1)'s defender anticipates the DHO and over-plays, C (5) keeps the ball and attacks off their own dribble drive before the defence sets. Path: C dribble toward paint; shoot.
- **Safety valve:** SG (2) is filling the north wing at full speed (approx. `{x: 330, y: 113}`). PG passes to SG for a transition three if the lane closes. Path: PG pass to SG; SG shoot.
