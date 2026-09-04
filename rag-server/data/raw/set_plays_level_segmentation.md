# Set Plays — Level Segmentation (Youth / Amateur / Competitive)

## 1. Level Segmentation Overview

Section summary: Basketball plays must be matched to the cognitive and physical development level of the players executing them — a play that is too complex for youth players will create confusion and bad habits, while a play that is too simple for competitive players will be scouted and neutralised; this section defines play selection, complexity limits, and installation rules for three distinct levels.

The three levels defined in this document are:
- **Youth (U14 / U16):** Players aged 13–16. Primary focus is skill development and fundamental movement patterns. Plays should have at most two steps and one read.
- **Amateur:** Adult recreational and club-level players without elite athletic backgrounds. Players have variable skill levels. Plays should have clear structure but can include one counter.
- **Competitive:** High school varsity, college, or semi-professional. Players have trained technical skills. Plays can include primary option, counter, and safety valve with full detail.

---

## 2. Youth Level (U14 / U16) — Plays and Guidelines

Section summary: Youth plays prioritise simple reads, fundamental movement patterns, and repetition of core basketball actions — passing, cutting, and catch-and-shoot — over complex screening actions or multi-step sequences.

**Youth play installation principles:**
- Never install more than two new plays per month. Mastery of two plays is more valuable than confusion about six.
- Every youth play has at most one read decision for the ball-handler. If the read is "is the cutter open?" the play is appropriate. If the read requires identifying defensive coverage type, the play is too complex for this level.
- BLOBs and SLOBs for youth should have a direct target and one simple counter only.
- Screen actions for youth should be isolated — one screen per play, not stagger or double screens.
- All plays should be designed around the team's best ball-handler at the top of the key, as youth teams rarely have multiple reliable ball-handlers.

---

### Youth Play Y-01: GIVE AND GO

Section summary: GIVE AND GO is the most fundamental play in basketball — the point guard passes to a wing player and immediately cuts to the basket for a return pass — it teaches the pass-and-cut principle that underlies all more complex play families.

**Primary option → Counter → Safety valve**

- **Step 1 — Setup:** Point guard (PG / 1) has the ball at the top of the key (approx. `{x: 370, y: 255}`). Shooting guard (SG / 2) is on the north wing (approx. `{x: 330, y: 113}`). The other three players space to corners and the opposite wing.
- **Step 2 — Pass:** PG (1) passes to SG (2) on the north wing. This is a chest pass or bounce pass at the level of the players' ability.
- **Step 3 — Cut:** PG (1) immediately cuts hard toward the basket (approx. `{x: 90, y: 255}`), making eye contact with SG (2). The cut must be direct — no hesitation.
- **Primary option — Return pass:** SG (2) passes back to PG (1) cutting to the basket for a layup. Path: PG pass to SG; SG return pass to PG; PG layup shoot.
- **Counter — Hold if denied:** If PG's defender follows the cut: SG (2) holds the ball and dribbles to create a new angle. PG exits to the opposite corner. The possession resets.
- **Safety valve:** PG (1) exits the cut and fills the opposite wing if no return pass is available within two seconds.

**Youth coaching cues:**
- "Pass it and go!" — the cut starts the instant the ball leaves the passer's hands.
- Look at the receiver after the pass to signal intent.
- The cut is only valuable when it is sharp — walk-speed cuts do not create scoring opportunities.

---

### Youth Play Y-02: SIMPLE PIN-DOWN (One Screen)

Section summary: SIMPLE PIN-DOWN introduces the concept of setting and using an off-ball screen to free a shooter — using a single pin-down screen rather than a stagger or double screen, making the read straightforward for youth players.

**Primary option → Counter → Safety valve**

- **Step 1 — Setup:** PG (1) at top (approx. `{x: 370, y: 255}`) with the ball. Center (C / 5) at the south block (approx. `{x: 145, y: 323}`). Shooting guard (SG / 2) starts in the south corner (approx. `{x: 87, y: 438}`). Small forward (SF / 3) and power forward (PF / 4) space to the north wing and north corner.
- **Step 2 — Pin-down:** C (5) sets a pin-down screen on SG (2)'s defender, screening downward — C (5) moves toward the baseline and stops. SG (2) uses the screen and cuts upward toward the south wing (approx. `{x: 330, y: 398}`).
- **Primary option — Catch-and-shoot:** PG (1) passes to SG (2) at the south wing for a catch-and-shoot jump shot or three-pointer. Path: PG pass to SG; SG shoot.
- **Counter — C (5) seal:** If SG (2) is denied off the screen, C (5) immediately seals their defender and pivots to receive a post-entry pass from PG (1). Path: PG pass to C; C short post move.
- **Safety valve:** PG (1) dribbles to the north wing to reset if no option is available within four seconds.

**Youth coaching cues:**
- The screener (C / 5) must stop completely before the cutter uses the screen — moving screens are fouls.
- The cutter (SG / 2) should brush shoulders with the screener to make the screen effective.
- After setting the screen, the screener pivots and looks for the ball — "screen and seal."

---

### Youth Play Y-03: YOUTH BLOB (Simple Baseline Inbound)

Section summary: YOUTH BLOB is a simplified baseline out-of-bounds play using one screen and one direct scoring target — appropriate for youth teams who need a reliable BLOB without complex timing or multiple simultaneous cuts.

**Primary option → Counter → Safety valve**

- **Step 1 — Setup:** O1 (best passer) inbounds from behind the baseline (approx. `{x: 30, y: 255}`). O5 is at the south block (approx. `{x: 145, y: 323}`). O2 is at the south elbow (approx. `{x: 190, y: 323}`). O3 and O4 space to the wings.
- **Step 2 — Screen:** O5 sets a back-screen for O2. O2 cuts from the south elbow toward the basket (approx. `{x: 90, y: 255}`).
- **Primary option — Lob to O2:** O1 lobs the inbound pass to O2 cutting to the basket for a layup. Path: O1 inbound pass to O2; O2 shoot.
- **Counter — Entry to O3:** If O2 is denied, O3 at the south wing (approx. `{x: 330, y: 398}`) receives the inbound pass as a safe target to reset into half-court offence.
- **Safety valve:** O4 at the top of the key (approx. `{x: 370, y: 255}`) always steps out as the safe inbound target if no other option is open within four seconds.

**Youth coaching cues:**
- The inbounder (O1) must count silently to four — they have five seconds; rushing creates bad passes.
- O2's cut must be decisive — commit to the cut all the way to the basket, do not slow down.

---

## 3. Amateur Level — Plays and Guidelines

Section summary: Amateur-level plays have defined structure with one primary option and one counter, using screens and cuts that most adult recreational players can learn in one or two practice sessions; the focus is on clear spacing and one key decision node per play.

**Amateur play installation principles:**
- Players can learn and execute plays with one screen and one decision node within two to three practices.
- Plays should be callable with one or two words in a game environment.
- Avoid plays that require communication between three or more players simultaneously — amateur teams struggle with simultaneous coordination.
- BLOBs and SLOBs should aim for a two-step action with one clean scoring opportunity.

---

### Amateur Play A-01: ELBOW PICK AND ROLL

Section summary: ELBOW PICK AND ROLL is a basic ball screen at the elbow — simpler to execute than the HORNS family because the center starts at a defined position and the ball-handler's read is limited to roll vs. kick, not roll vs. pop vs. corner vs. ISO.

**Primary option → Counter → Safety valve**

- **Step 1 — Setup:** PG (1) has the ball at the top (approx. `{x: 370, y: 255}`). C (5) is at the north elbow (approx. `{x: 190, y: 188}`). SG (2) is in the north corner (approx. `{x: 87, y: 73}`). SF (3) and PF (4) on the south side for spacing.
- **Step 2 — Ball screen:** C (5) sets a ball screen for PG (1) at the elbow. PG drives toward the paint.
- **Primary option — C roll:** If X5 hedges, C (5) rolls hard to the basket (approx. `{x: 90, y: 255}`). PG delivers a bounce pass. Path: PG dribble; pass to C; C shoot.
- **Counter — Kick to corner:** If the lane closes, PG kicks to SG (2) in the north corner for an open three. Path: PG pass to SG; SG shoot.
- **Safety valve:** PF (4) at the south wing receives a reversal to reset if PG has no clear read within three seconds.

---

### Amateur Play A-02: SIMPLE BLOB BOX

Section summary: SIMPLE BLOB BOX is a two-action BLOB — one screen and one direct scoring cut — designed for amateur teams who can execute a box formation but cannot coordinate multiple simultaneous screens.

**Primary option → Counter → Safety valve**

- **Step 1 — Box setup:** O1 inbounds. O2 and O3 at the elbows. O4 and O5 at the blocks.
- **Step 2 — One screen:** O4 sets a back-screen on O2's defender. O2 cuts from the elbow to the basket.
- **Primary option — Lob to O2:** O1 lobs to O2 cutting to the basket. Path: O1 inbound pass to O2; O2 finish.
- **Counter — O4 seal:** If O2 is denied, O4 seals their defender at the south block. O1 passes to O4 for a short post move.
- **Safety valve:** O5 steps out to the free-throw line (approx. `{x: 280, y: 255}`) as the safe inbound target.

---

## 4. Competitive Level — Plays and Guidelines

Section summary: Competitive-level plays use the full three-layer structure (primary option, counter, safety valve), can involve multiple simultaneous actions, and assume players can execute under defensive pressure after consistent practice; the plays at this level are drawn from the dedicated HORNS, Floppy, Elevator, DHO, and Motion-5 family documents.

**Competitive play installation principles:**
- All plays must have a primary option, counter, and safety valve. Any play missing any of these layers is not ready for competitive installation.
- Teams should have a minimum of eight plays in the active playbook: two half-court sets, two BLOBs, one SLOB, one ATO, and one zone play for each zone type they commonly face.
- Install plays using the five-step process: whiteboard introduction → walk-through without defence → walk-through with passive defence → full-speed with live defence → game-context reinforcement.
- Review the active playbook every three weeks and retire plays that have been stopped three consecutive times by the same opponent.

**Recommended competitive play stack (quick reference):**
- Half-court primary set: HORNS FLAT (see set_plays_horns_family.md)
- Half-court counter set: FLOPPY STANDARD (see set_plays_floppy_family.md)
- Ball-screen chain: CHICAGO LOOP (see basketball_set_plays.pdf, HTO-PR-03)
- ATO (end of clock): ELEVATOR DOORS (see set_plays_elevator_family.md)
- Zone attack (2-3): HIGH-LOW ZONE ATTACK (see set_plays_zone_specific.md)
- Zone attack (1-3-1): CORNER FLOOD ATTACK (see set_plays_zone_specific.md)
- BLOB primary: BOX LAKER CUT (see basketball_set_plays.pdf, BLOB-BX-01)
- SLOB primary: STAGGER SLOB (see basketball_set_plays.pdf, SLOB-DS-02)
