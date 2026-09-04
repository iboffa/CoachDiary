# Baseline Out-of-Bounds, Sideline Out-of-Bounds, and After-Timeout Plays

---

## 0. CoachDiary Play Generation Rules for BLOB / SLOB / ATO

Section summary: These rules translate inbound plays into CoachDiary's PlayEditorPersistedState format — inbounder placement, actionType assignments, and phase breakdown.

**Inbounder token placement (always offense-1):**
- BLOB: inbounder at `{x:30, y:255}` (behind baseline; shift y north/south for angle). Inbounder is OUT of bounds — do not snap to a court zone.
- SLOB: inbounder on the north sideline (`y=0`) or south sideline (`y=510`). Use `{x:150, y:0}`, `{x:280, y:0}`, or `{x:370, y:0}` for north; mirror for south. NEVER place the SLOB inbounder at `x=570` (that is the half-court line) or at `y=255`.

**Phase breakdown:**
- Phase 1 — Setup: cutters move to free themselves (actionType: `cut`); screeners move to screen positions (actionType: `screen`); inbounder holds out of bounds (no path in Phase 1 — inbounder appears in playerPositions at their out-of-bounds position only).
- Phase 2 — Inbound pass: inbounder passes to the open cutter (actionType: `pass`, targetId: receiver; path from inbounder position to cutter's catch position); cutter arrives at catch spot (update playerPositions).
- Phase 3 — Conclusion: receiver shoots (actionType: `shoot`) or drives (actionType: `dribble`).

**Critical rule:** The inbounder's path is always actionType `pass`. Never give the inbounder a `dribble` path — they are standing out of bounds and cannot dribble inbounds.

---

## 1. BLOB Overview — Baseline Out-of-Bounds Design Principles

Section summary: BLOB plays are inbound situations under the opponents' basket; well-prepared teams score directly from BLOBs one to two times per game, and every BLOB must include a direct-score option and a safe inbound fallback.

BLOB = Baseline Out-of-Bounds. The inbounder stands out of bounds under the opponents' basket and has five seconds to pass the ball inbounds. The inbounder may not move laterally along the baseline until another player has touched the ball. The inbounder is most commonly the best passer on the floor, not the best scorer — the scorer is the primary target. If you are designing a BLOB play, embed a misdirection element (a simultaneous flash or dummy cut) to pull defensive attention before the primary scoring action unfolds.

Half-court canvas reference: hoop at {x:54, y:255}. The baseline from which the inbounder stands is at approximately x:30–54. The free-throw line is at approximately x:175, y:255. The three-point corners are at approximately {x:54, y:90} and {x:54, y:420}.

---

## 2. BLOB Box-Formation Sets

Section summary: Box formations place four players at the two elbows and two blocks in a symmetrical alignment that creates multiple simultaneous threats and prevents the defence from predicting the direction of the primary scoring action.

A box formation starting alignment places the two guards at the two elbows (approx. {x:175, y:155} and {x:175, y:355}) and the two bigs at the two blocks (approx. {x:87, y:155} and {x:87, y:355}). The inbounder (O1) stands at the baseline (approx. x:30, y:255).

### Play BLOB-BX-01: BOX LAKER CUT

Section summary: BOX LAKER CUT is the most common BLOB play at all levels; it generates a lob at the basket off a back-screen with a pin-down counter and a post-seal safety valve.

**Starting formation:** Box alignment. O1 (best passer) inbounds from the baseline (approx. x:30, y:255). O2 at the strong-side (SS) elbow (approx. {x:175, y:155}). O3 at the weak-side (WS) elbow (approx. {x:175, y:355}). O4 at the SS block (approx. {x:87, y:155}). O5 at the WS block (approx. {x:87, y:355}).

**Primary option — O2 lob to the basket:**
- O4 and O5 flash simultaneously to the SS corner (approx. {x:54, y:90}), drawing defensive attention.
- O3 (elbow WS) sets a hard back-screen on X2 (guarding O2 at the elbow SS).
- O2 cuts hard off the back-screen toward the basket (path from {x:175, y:155} toward {x:54, y:255}).
- O1 lobs over the top to O2 cutting to the basket. O2 catches and finishes at the rim.

**Counter A — O3 pin-down curl:**
- If X2 navigates the back-screen, O3 immediately pivots and sets a pin-down screen for O4, who curls from the corner (approx. {x:54, y:90}) back to the elbow (approx. {x:175, y:155}).
- O1 delivers a direct inbound pass to O4 at the elbow for a mid-range jumper or a drive.

**Counter B — O5 post seal:**
- O5 (who flashed to the SS corner) pivots immediately and seals their defender at the SS block (approx. {x:87, y:155}).
- O1 delivers a post-entry inbound pass to O5 for an immediate post move.

**Safety valve:**
- O4 steps out to the free-throw line (approx. {x:175, y:255}).
- O1 inbounds to O4 to reset into half-court offence. No shot attempt from this action — it is a possession-preservation reset.

---

### Play BLOB-BX-02: BOX DOUBLE

Section summary: BOX DOUBLE uses simultaneous screens on both sides of the lane to overwhelm defensive communication and create a mid-range or driving opportunity from a clean catch inside.

**Starting formation:** Box alignment. O1 inbounds from the baseline (approx. x:30, y:255). O2 at SS elbow (approx. {x:175, y:155}). O3 at WS elbow (approx. {x:175, y:355}). O4 at SS block (approx. {x:87, y:155}). O5 at WS block (approx. {x:87, y:355}).

**Primary option — read the more open cutter:**
- O4 screens for O2 on the SS simultaneously while O5 screens for O3 on the WS simultaneously.
- Both screen actions happen at the same moment, forcing the defence to communicate two separate actions at once.
- O2 and O3 both cut off their respective screens toward the block/elbow area (O2 to approx. {x:87, y:155}; O3 to approx. {x:87, y:355}).
- O1 reads which cutter is more open and delivers the inbound pass to that player for a mid-range jumper or a driving opportunity toward the basket.

**Counter — post seal:**
- If both cutters are denied, O4 and O5 pivot immediately and seal their screened defenders at the block.
- O1 inbounds to whichever post player has the cleaner body position (either {x:87, y:155} or {x:87, y:355}).

**Safety valve:**
- O2 pops out to the three-point arc (approx. {x:175, y:113}) after their cut.
- O1 throws a safe inbound pass to O2 to reset into half-court offence.

---

## 3. BLOB Stack-Formation Sets

Section summary: Stack formations place players in a vertical line near the ball, creating ambiguity about which player will cut first and in which direction, forcing defenders to read and react rather than play their pre-assigned position.

A stack formation aligns three or four players in a vertical column near the inbounder's side of the lane. The top player of the stack is the furthest from the basket; the bottom player is closest to the block.

### Play BLOB-SK-01: STACK ZIPPER

Section summary: STACK ZIPPER frees a shooter with a vertical cut up the lane using a single screen from a stacked alignment, with a lob counter to the top of the stack and a skip-pass option to the weak side.

**Starting formation:** O1 inbounds from the SS baseline (approx. x:30, y:255). O3, O4, O5 stacked vertically near the SS lane line (O3 closest to the baseline at approx. {x:54, y:155}, O4 in the middle at approx. {x:87, y:155}, O5 at the top of the stack at approx. {x:120, y:155}). O2 spaced WS (approx. {x:175, y:355}).

**Primary option — O3 zipper catch at the elbow:**
- O4 sets a screen for O3. O3 cuts upward (the zipper cut) from the block area (approx. {x:54, y:155}) toward the elbow or free-throw line (approx. {x:175, y:155}).
- If X3 is caught on the screen, O1 fires a direct inbound pass to O3 at the elbow for a mid-range jumper or a one-dribble drive.

**Counter A — lob to O5:**
- If O3 is denied on the zipper cut, O5 (top of the stack at approx. {x:120, y:155}) cuts baseline toward the SS block (approx. {x:87, y:155}). O4's screen re-angles to assist O5's cut.
- O1 lobs over the top to O5 at the basket.

**Counter B — O2 skip three-pointer:**
- The entire stack action serves as misdirection. O2 has drifted from the WS corner (approx. {x:54, y:420}) toward the WS wing (approx. {x:175, y:390}).
- If X2 ball-watches the stack, O1 throws a long skip inbound pass to O2 for a three-pointer.

**Safety valve:**
- O3 continues the zipper cut to the top of the key (approx. {x:280, y:255}) for a safe inbound pass and a half-court offence reset.

---

### Play BLOB-SK-02: STACK BLAST

Section summary: STACK BLAST features a simultaneous split where two players cut in opposite directions off the same stack, forcing the defence to choose which threat to cover and leaving a third player open in the corner.

**Starting formation:** O1 inbounds from the SS baseline (approx. x:30, y:155 side). O2, O3, O4 stacked at the SS block (approx. {x:54–87, y:155}). O5 positioned near the top of the key (approx. {x:280, y:255}).

**Primary option — read O2 or O3:**
- O2 cuts toward the basket (baseline cut under the hoop, path from {x:54, y:155} through {x:54, y:255} to the WS block).
- O3 cuts in the opposite direction (zipper cut up the lane, path from {x:87, y:155} toward {x:175, y:155}).
- O4 pops immediately to the three-point corner (approx. {x:54, y:90}).
- The defence must choose: X2 follows O2 baseline; X3 follows O3 up the lane. Only one cut can be fully contested.
- O1 reads which cutter is open and delivers the inbound pass.

**Counter — O4 corner three-pointer:**
- If both cutters are denied, O4 has slipped to the SS corner (approx. {x:54, y:90}) completely unguarded.
- O1 fires directly to O4 for a corner three-pointer.

**Safety valve:**
- O5 (positioned near the top of the key at approx. {x:280, y:255}) remains stationary throughout.
- O1 passes to O5 as a clean inbound and possession reset.

---

## 4. BLOB Line-Formation Sets

Section summary: Line formations spread players horizontally across the paint area from block to block, creating simultaneous threats at every scoring zone inside and immediate perimeter options as counters.

A line formation aligns four players in a horizontal row across the width of the paint (approx. from {x:87, y:155} to {x:87, y:355}). The inbounder (O1) stands at the baseline (approx. x:30, y:255).

### Play BLOB-LN-01: LINE CROSS

Section summary: LINE CROSS generates a cross-screen action inside the paint for a quick lob or post entry, with a perimeter skip-pass counter when all interior defenders collapse.

**Starting formation:** O1 inbounds from the baseline (approx. x:30, y:255). O2, O3, O4, O5 stand in a horizontal line across the paint (O2 at SS block approx. {x:87, y:155}, O3 at SS low post approx. {x:87, y:195}, O4 at WS low post approx. {x:87, y:315}, O5 at WS block approx. {x:87, y:355}).

**Primary option — O3 lob to the SS block:**
- O4 and O3 perform a cross-screen simultaneously: O4 screens for O3 while O3 screens for O4 (a pick-the-picker action).
- O3 rolls toward the SS block (approx. {x:87, y:155}) after the cross action.
- O1 lobs the inbound pass to O3 at the SS block for a catch-and-finish.

**Counter — O4 post seal:**
- After setting the first screen, O4 seals their defender at the block (approx. {x:87, y:355}) and calls for the ball.
- O1 passes directly to O4 inside for a post move.

**Perimeter counter — O2 skip three-pointer:**
- O2 drifts from the SS block to the SS three-point corner (approx. {x:54, y:90}) during the cross action.
- If all interior defenders are occupied with the cross, O1 fires a skip pass to O2 for a three-pointer.

**Safety valve:**
- O5 steps out from the WS block toward the free-throw line (approx. {x:175, y:355}).
- O1 inbounds to O5 for a safe catch and a half-court reset.

---

## 5. SLOB Overview — Sideline Out-of-Bounds Design Principles

Section summary: SLOB plays inbound from the sideline and offer more space to operate than BLOB plays; they can target a direct score or a clean inbound that launches an immediate half-court set.

SLOB = Sideline Out-of-Bounds. The inbounder stands out of bounds on the sideline and may move laterally along the sideline within their designated zone. The inbounder may also receive the ball back after it has touched another player. The primary strategic choice in designing a SLOB is: (A) direct score within three seconds or (B) clean inbound entry into a full half-court set. Choose based on shot-clock time remaining and the score situation.

Half-court canvas reference: the sidelines run horizontally at y≈0 (north) and y≈510 (south). The half-court boundary is the right edge of the canvas at x≈570. The nearest frontcourt SLOB inbounder positions cover x-coordinates from x≈100 to x≈400 along those sidelines.

---

## 6. Direct-Score SLOBs

Section summary: Direct-score SLOBs are designed to produce a shot within three seconds of the inbound pass and are highest-value at the end of quarters or halves when there is no time to run a full set.

### Play SLOB-DS-01: ZIPPER WIDE

Section summary: ZIPPER WIDE uses a vertical zipper cut to free a shooter coming toward the ball on the sideline side, with a lob counter off the screen and a skip reversal to the far wing.

**Starting formation:** O1 inbounds from the sideline near the frontcourt (approx. {x:350, y:510} on the sideline). O2 and O3 stacked vertically near the SS lane line (O3 closer to the baseline at approx. {x:175, y:390}, O2 at approx. {x:230, y:390}). O4 in the far corner (approx. {x:54, y:90}). O5 near the near block (approx. {x:87, y:355}).

**Primary option — O2 zipper catch:**
- O3 sets a screen for O2. O2 cuts vertically upward (the zipper direction) from approximately {x:230, y:390} toward the ball at the elbow or high post (approx. {x:200, y:255}).
- O1 passes directly to O2 at the elbow or high post for a catch-and-shoot jumper or a one-dribble pull-up.

**Counter A — lob to O3:**
- If X2 fights over O3's screen, O3 seals and cuts baseline toward the basket (path from {x:175, y:390} toward {x:54, y:355}).
- O1 lobs over the top to O3 for a catch-and-finish.

**Counter B — far-wing skip via O5:**
- The entire action is misdirection. O4 has drifted from the far corner (approx. {x:54, y:90}) to the far wing (approx. {x:200, y:113}).
- O1 passes to O5 near the near block (approx. {x:87, y:355}), who immediately kicks the ball to O4 at the far wing for a three-pointer.

**Safety valve:**
- O2 continues the zipper cut to the top of the key (approx. {x:280, y:255}) for a clean inbound pass and a half-court offence reset.

---

### Play SLOB-DS-02: STAGGER SLOB

Section summary: STAGGER SLOB replicates the stagger-screen mechanism of half-court sets in a sideline inbound context, creating a catch-and-shoot three-point opportunity with a mismatch-pop counter and a direct post-entry option.

**Starting formation:** O1 inbounds from the sideline (approx. {x:230, y:510}). O4 at the near elbow (approx. {x:175, y:355}). O5 at the near block (approx. {x:87, y:355}), forming a stagger (O5 lower, O4 higher). O2 starts in the far corner (approx. {x:54, y:90}). O3 at the top of the key (approx. {x:280, y:255}).

**Primary option — O2 catch-and-shoot three:**
- O2 cuts from the far corner (approx. {x:54, y:90}) using first O5's baseline screen then O4's elbow screen (a stagger).
- O2 pops to the top of the key (approx. {x:280, y:255}) or the ball-side wing (approx. {x:280, y:155}).
- O1 inbounds the ball directly to O2 for a catch-and-shoot three-pointer.

**Counter A — O4 mismatch pop:**
- If the defence switches both screens, O4 is now guarded by a smaller player.
- O4 pops immediately to the three-point line (approx. {x:230, y:420}) for a mismatch three-pointer.

**Counter B — O5 post entry:**
- O5 seals their defender at the block (approx. {x:87, y:355}) after setting the stagger screen.
- O1 inbounds directly to O5 for a post-entry score without running the full stagger action.

**Safety valve:**
- O3 is positioned at the top of the key (approx. {x:280, y:255}) throughout.
- O1 passes to O3 for a clean inbound pass and a half-court offence reset.

---

## 7. Entry-to-Set SLOBs

Section summary: Entry-to-set SLOBs prioritise a clean inbound followed by an immediate half-court set play execution; they are appropriate when the shot clock provides enough time for a full set to develop.

### Play SLOB-ES-01: INVERT ENTRY

Section summary: INVERT ENTRY inbounds to the centre who immediately executes a dribble hand-off with the point guard at the top of the key, catching the defence mid-transition before assignments are locked in.

**Starting formation:** O1 inbounds from mid-sideline (approx. {x:350, y:510}). O5 steps out to the near sideline (approx. {x:350, y:420}) as the primary inbound target. O2, O3, O4 space across the court (O2 at approx. {x:230, y:113}, O3 at approx. {x:175, y:255}, O4 at approx. {x:175, y:390}).

**Primary action — DHO into immediate HTO set:**
- O1 passes to O5 at the near sideline (approx. {x:350, y:420}).
- O1 immediately sprints inbounds and receives a dribble hand-off (DHO) from O5 at the top of the key (approx. {x:280, y:255}). O5's defender is not expecting a quick hand-off.
- O1 receives the DHO from O5 and immediately calls the designated HTO set by name.
- The team enters the designated half-court set from this moment.

**Key rationale:**
- The quick DHO catches the defence mid-transition before defenders have locked into their half-court assignments from the SLOB.
- The combination of the SLOB inbound action and the immediate DHO gives the offence a half-second tempo advantage at the start of the half-court set.

**Safety valve:**
- O3 (positioned at the top of the key area approx. {x:175, y:255}) receives a direct pass from O1 if the DHO with O5 is denied.
- O3 initiates the designated half-court set as the ball-handler.

---

## 8. ATO Overview — After-Timeout Play Design Principles

Section summary: ATO plays are designed for the highest-pressure moments — end of quarters, end of games, and critical possessions — and must be simple, memorable, and executable within 30 to 60 seconds of a timeout.

ATO = After-Timeout Play. These plays must be executable within the time it takes to deliver them in a timeout huddle (30 to 60 seconds). Design rules for ATO plays:
- No more than three steps in the primary action.
- The target is a shot within five seconds of the inbound pass.
- Design around the best scorer's preferred shot type, not the most complex available action.
- Remove as many decision points as possible from the ball-handler by pre-calling the specific action to execute.

Half-court canvas reference: hoop at {x:54, y:255}. Corner three-point spots at approx. {x:54, y:90} and {x:54, y:420}. Wing three-point spots at approx. {x:175, y:113} and {x:175, y:397}. Top of the key at approx. {x:280, y:255}.

---

## 9. End-of-Clock ATOs (five seconds or fewer remaining)

Section summary: With five seconds or fewer on the clock, the play has room for exactly one action and one shot attempt; all complexity must be eliminated in favour of a single clean read.

With five or fewer seconds remaining, the ball-handler has no time for multiple reads. The inbounder is the decision-maker. Assign the inbounder the responsibility of reading the primary option versus the counter — the ball-handler's only job is to catch and shoot.

### Play ATO-EC-01: CURL WINNER

Section summary: CURL WINNER frees the best scorer off a single hard screen for a catch-and-shoot three or mid-range jumper, with a backdoor lob counter and a post-seal option when the scorer is fully denied.

**Personnel:** Best scorer (O2) is the primary ball-recipient. Best screener (O5) sets the screen. O1 inbounds from the baseline or sideline and is a capable passer under pressure.

**Starting positions:** O5 sets a hard screen at the elbow or wing (approx. {x:175, y:155} on the SS wing). O2 starts in the SS corner (approx. {x:54, y:90}). O1 inbounds (approx. x:30, y:180 from baseline, or from the nearest sideline).

**Primary option — curl catch-and-shoot:**
- O2 curls off O5's screen at full speed, path from corner (approx. {x:54, y:90}) curling to the wing (approx. {x:200, y:155}).
- O1 delivers the pass at the moment O2 is coming off the screen. O2 catches and shoots in one fluid motion.

**Counter — O2 backdoor lob:**
- If X2 goes under the screen or overplays the curl side, O2 rejects the screen and cuts backdoor toward the basket (path from {x:54, y:90} cutting to {x:54, y:255}).
- O1 lobs directly to O2 for a lay-up.

**Counter B — O5 post entry:**
- If O2 is fully denied and the backdoor is unavailable, O5 seals their defender at the block (approx. {x:87, y:155}).
- O1 passes to O5 inside for a post move and a two-point score.

---

### Play ATO-EC-02: WIDE PIN

Section summary: WIDE PIN uses a pin-down screen to free a shooter in the corner for a catch-and-shoot three, with a direct post lob to the screener when the shooter is denied.

**Personnel:** O1 inbounds from the baseline. O5 at the near block. O2 above the three-point arc at the top of the key (approx. {x:280, y:255}). O3 and O4 spaced on the WS to keep help defenders occupied.

**Primary option — O2 corner three-pointer:**
- O5 sets a pin-down screen (screening downward toward the baseline) for O2.
- O2 cuts from the top of the key (approx. {x:280, y:255}) down toward the SS corner (approx. {x:54, y:90}).
- O1 delivers the inbound pass to O2 arriving in the corner for a catch-and-shoot corner three-pointer.

**Counter — O5 post entry:**
- If O2 is denied, O5 pivots immediately and seals their defender at the block (approx. {x:87, y:155}).
- O1 lobs directly inbounds to O5 inside for a post-move score.

---

## 10. Medium-Clock ATOs (6–20 seconds remaining)

Section summary: With 6–20 seconds on the clock, one full set action and one counter are achievable; the goal is a high-percentage shot with time for one follow-up action if the primary is denied.

### Play ATO-MC-01: ELEVATOR DOORS

Section summary: ELEVATOR DOORS uses two screeners closing simultaneously on a cutter to create a wide-open three-pointer at the top of the key or wing, with a pop counter when the cutter rejects the doors.

**Starting positions:** O4 and O5 stand shoulder-to-shoulder at the free-throw line area (approx. {x:175, y:210} and {x:175, y:300}), creating a gap between them. O2 starts at the baseline (approx. {x:54, y:255}). O1 holds the ball at the top of the key (approx. {x:280, y:255}). O3 spaced on the WS wing (approx. {x:280, y:390}).

**Primary option — O2 three-pointer above the arc:**
- O2 cuts vertically through the gap between O4 and O5, path from the baseline (approx. {x:54, y:255}) upward toward the top of the key.
- At the moment O2 is between O4 and O5, both O4 and O5 step toward each other, closing the doors on X2 who is following O2. X2 is screened simultaneously by both players.
- O2 emerges above the three-point line (approx. {x:280, y:255}) completely open. O1 delivers the pass to O2 for a catch-and-shoot three-pointer.

**Counter — O4 or O5 pop:**
- If O2 rejects the cut (does not go through the doors), O4 or O5 pops to the three-point line (approx. {x:230, y:155} or {x:230, y:355}) after the doors action.
- O1 passes to the open big for a three-pointer.

---

### Play ATO-MC-02: HORNS ATO

Section summary: HORNS ATO uses the familiar HORNS alignment to reduce mental load under pressure while targeting the best scoring option with a pre-called specific action that eliminates the ball-handler's read entirely.

**Starting positions:** Standard HORNS alignment. Point guard (PG / 1) at the top of the key (approx. {x:280, y:255}). Power forward (PF / 4) and centre (C / 5) at the two elbows (approx. {x:175, y:155} and {x:175, y:355}). Shooting guard (SG / 2) in the SS corner (approx. {x:54, y:90}). Small forward (SF / 3) in the WS corner (approx. {x:54, y:420}).

**Pre-called specific action:**
- The coach designates before the inbound which specific HORNS action to execute (roll, pop, or corner kick), eliminating the read from the ball-handler. Under extreme pressure, removing the decision from the ball-handler improves execution consistency.

**Primary option (pre-called action example — corner kick):**
- PG (1) uses C (5)'s ball screen at the top of the key (approx. {x:230, y:255}).
- PG (1) immediately executes the pre-called action: skip pass to SG (2) in the SS corner (approx. {x:54, y:90}) for a three-pointer.

**Counter (emergency only):**
- If the pre-called action is taken away before the ball screen, PG (1) has a single emergency counter: drive directly to the basket (path from {x:280, y:255} toward {x:54, y:255}) and draw a foul or finish at the rim.

---

## 11. Full-Clock ATOs (20 or more seconds remaining, needing a three-pointer)

Section summary: With 20 or more seconds remaining and needing a three-pointer, there is time to run a full sequenced set targeting the team's best three-point shooter through multiple screening actions.

### Play ATO-FC-01: NEED THREE

Section summary: NEED THREE is a play template designed exclusively for three-point shot creation when trailing by three or more points late in a game, using sequential screening to find the open shooter through a pre-prioritised sequence.

**Personnel assignment:**
- Three best three-point shooters: O2 (SS corner, approx. {x:54, y:90}), O3 (SS wing, approx. {x:230, y:113}), O4 (WS wing, approx. {x:230, y:397}).
- O5 as dedicated screener at the high post (approx. {x:175, y:255}).
- O1 as ball-handler at the top of the key (approx. {x:280, y:255}).

**Spacing:** Maximum spacing across the three-point arc. O2, O3, O4 occupy the SS corner, SS wing, and WS wing. O5 at the high post. O1 at the top.

**Primary option — sequential screening reads:**
- O5 screens for O2 (in the SS corner) first. O1 passes to O2 if open.
- If O2 is denied, O5 quickly pivots and sets a second screen for O3 (on the SS wing). O1 passes to O3 if open.
- If O3 is denied, O1 self-creates a three-point attempt off a ball screen from O4 at the top or wing (approx. {x:280, y:155}).

**Sequential reads by O1:** Pass to O2, then O3, then self-create. O1 does not advance to the next option until the current option is definitively taken away — do not rush.

**Clock management rule:**
- Initiate the play with 12–15 seconds remaining to allow time for two screening actions and a clean shot release.
- Do not rush the shot: a clean three-point attempt with eight seconds remaining is superior to a contested one with 15 seconds remaining.

---

## 12. ATO and BLOB/SLOB Play-Calling Under Pressure — Coaching Notes

Section summary: Practical guidelines for calling out-of-bounds and after-timeout plays under game-pressure conditions, covering communication, player roles, and the mental framework for the inbounder.

- **Name every play with one to three syllables.** Under pressure, longer names fail to register. Use call names consistently across practices and games.
- **The inbounder is a decision-maker, not a passer.** Train the inbounder to scan all options before picking up the ball. The five-second clock starts when the official hands the ball — use the first two seconds to read the defence.
- **Pre-practice the safety valve explicitly.** Every BLOB and SLOB rep in practice should include at least one repetition where the primary and counter are both taken away, forcing the inbounder to execute the safety valve cleanly.
- **ATO plays must be installed in advance.** A play called for the first time in a timeout has a low execution rate. Designate five ATO plays as permanent fixtures of the playbook and rehearse them at full speed in every third or fourth practice.
- **Zone defence changes BLOB reads significantly.** Against a 2-3 zone defending a BLOB, the gap at the free-throw line (approx. {x:175, y:255}) is open. Consider adding a flash-to-gap action (O3 or O4 flashes to the high-post gap) as the primary option in any BLOB against zone.
