# Set Plays — Motion-5 Family

## 0. CoachDiary Play Generation Rules for MOTION-5

Section summary: Motion-5 is rule-based, not scripted — when generating a Motion-5 play, encode ONE representative read (pass-and-cut or screen-away) rather than the full motion ruleset.

**Starting formation — always five-out:**
- offense-1 (PG): top of key `{x:370, y:255}`
- offense-2 (SG): wing north `{x:330, y:113}`
- offense-3 (SF): wing south `{x:330, y:398}`
- offense-4 (PF): corner north `{x:87, y:73}`
- offense-5 (C): corner south `{x:87, y:438}`
No player starts inside the three-point arc.

**Pattern A — Pass-and-cut:**
- Phase 1: ball-handler passes to wing (actionType: `pass`, targetId: wing player), ball-handler cuts immediately to basket (actionType: `cut`, endpoint near `{x:90, y:255}`).
- Phase 2: wing returns pass to cutting ball-handler (actionType: `pass`, targetId: cutter) — ballCarrierId updates to cutter. OR wing drives (actionType: `dribble`).
- Phase 3: basket finish (actionType: `shoot`).

**Pattern B — Screen-away:**
- Phase 1: non-ball player screens for the player two spots over on the arc (actionType: `screen`); screened player reads and cuts (actionType: `cut`).
- Phase 2: ball-handler passes to the freed cutter (actionType: `pass`, targetId: freed player).
- Phase 3: freed player shoots (actionType: `shoot`).

**Critical rule:** No purposeless dribbling — a player's dribble path must end at a paint attack or pull-up position, never back at the arc.

---

## 1. Motion-5 Family Overview

Section summary: Motion-5 (also called Five-Out Motion) places all five players on or beyond the three-point arc, creating maximum driving lanes; players operate within a rule set of pass-and-cut, drive-and-kick, and screen-away actions rather than scripted sequences, making the offence difficult to scout while developing player decision-making.

Motion-5 is a rule-based offence, not a set play. Players follow a defined set of "if-then" principles on every possession. Because no two possessions look the same, Motion-5 is extremely difficult to scout or build a specific defensive game plan against. The trade-off is that it requires significant practice time — players must internalise the rules before the system functions correctly in competition.

**Motion-5 is most effective when:**
- All five players can shoot from the three-point arc and handle the ball in space.
- The team has high basketball IQ and communication skills.
- The coaching philosophy prioritises player development and reads over scripted execution.

**Base Motion-5 alignment pixel coordinates:**
- Point guard (PG / 1): top of the key `{x: 370, y: 255}` — primary initiator
- Shooting guard (SG / 2): north wing `{x: 330, y: 113}` — perimeter threat
- Small forward (SF / 3): south wing `{x: 330, y: 398}` — perimeter threat
- Power forward (PF / 4): north corner `{x: 87, y: 73}` — stretched floor
- Center (C / 5): south corner `{x: 87, y: 438}` — stretched floor

All players start on the three-point arc or beyond. No player is in the paint at initiation.

---

## 2. Motion-5 Core Rules

Section summary: These five rules define every possession in Motion-5; every player must know all five rules, not just their own role, so they can read each other's decisions and fill the correct position after each action.

**Rule 1 — Pass and cut (give-and-go priority):**
- After any pass, the passer executes a basket cut (direct line toward the hoop, approx. `{x: 90, y: 255}`) and looks for a return pass.
- If no return pass arrives within two seconds, the cutter exits to the opposite side of the court and fills a vacant perimeter spot.
- This rule means the passer never stands still. Movement is constant.

**Rule 2 — Backdoor priority:**
- If the cutter's defender is in denial stance (between the cutter and the ball), the cutter immediately cuts backdoor — away from the ball toward the basket.
- The ball-handler reads the backdoor cut and delivers the pass. A denied player is an invitation to back-cut, not to fight the denial.

**Rule 3 — Drive and kick:**
- On any dribble penetration, all four off-ball players must space away from the driver and prepare to catch-and-shoot. No player collapses toward the ball on a drive.
- The driver reads the first help defender and kicks to the open shooter. Do not force the finish against multiple defenders when a three-point shooter is open.

**Rule 4 — Screen away:**
- If no pass, cut, or drive is available after two seconds of ball possession, the ball-handler screens away for the player two spots over on the arc.
- The screener sets the screen and either rolls toward the basket (if they can score in the paint) or pops back to the arc (if they are a perimeter shooter).
- The screened player reads the coverage and curls, flares, or back-cuts.

**Rule 5 — No purposeless dribbling:**
- A player may not dribble unless they are: (a) attacking the basket, (b) initiating a DHO action, or (c) improving their passing angle.
- Dribbling in place (holding position on the arc while dribbling) collapses spacing and kills motion. Players who commit this error return the ball immediately and cut.

---

## 3. Motion-5 Called Plays within the Motion Framework

Section summary: Even within a Motion-5 system, coaches call specific "triggers" during live play to direct the next action; these triggers layer structure on top of the motion rules when a specific scoring opportunity needs to be manufactured.

### Trigger: "VEER"

- **What it signals:** The point guard (PG / 1) calls "VEER" as they receive or bring up the ball. This signals center (C / 5) to cut from the south corner (approx. `{x: 87, y: 438}`) to the high post (approx. `{x: 280, y: 255}`) to serve as a DHO hub.
- **Action sequence:** PG dribbles toward C at the high post and executes a DHO. C's defender must commit. SG (2) or SF (3) reads C's read — if C keeps the ball they set a P&R; if C hands off they become the roller.
- **Primary option:** PG receives DHO momentum and drives the lane. Path: DHO from C to PG; PG dribble toward hoop.
- **Counter:** C keeps the ball on the DHO and shoots a mid-range jumper from the high post (approx. `{x: 280, y: 255}`). Path: C shoot.
- **Safety valve:** PF (4) in the north corner (approx. `{x: 87, y: 73}`) receives a kick-out from PG or C for a three.

### Trigger: "ZIP"

- **What it signals:** PG calls "ZIP" to signal a zipper cut from the corner to the free-throw line for the designated scorer (SG / 2 or SF / 3).
- **Action sequence:** C (5) or PF (4) sets a pin-down screen for the designated scorer cutting from the corner up the lane (the "zip" or "zipper" cut). The scorer arrives at the elbow or free-throw line extended for a catch-and-shoot or one-dribble pull-up.
- **Primary option:** PG passes to the scorer at the elbow (approx. `{x: 190, y: 188}`) off the zip cut for a mid-range shot or drive. Path: PG pass to SG; SG shoot or dribble.
- **Counter:** If the zip cutter is denied, C (5) — who just set the pin-down screen — seals the defender and flashes to the block for a post entry. Path: PG pass to C on the block.
- **Safety valve:** The passer (PG) fills the vacated corner after the pass.

### Trigger: "LOOP"

- **What it signals:** A double-screen is set for the best shooter to loop from one corner, through the paint, and emerge at the opposite corner.
- **Action sequence:** PF (4) sets a screen at the north block (approx. `{x: 145, y: 188}`). C (5) sets a screen at the south block (approx. `{x: 145, y: 323}`). SG (2) starts in the north corner and loops through the paint, using first PF's screen then C's screen, to the south corner (approx. `{x: 87, y: 438}`).
- **Primary option:** SF (3) or PG (1) delivers a skip pass to SG (2) arriving in the south corner for a catch-and-shoot three.
- **Counter:** PF (4) or C (5) seals their defenders after setting the loop screens and posts up. SG or SF enters the ball to the better post seal.
- **Safety valve:** PG (1) at the top of the key (approx. `{x: 370, y: 255}`) receives the ball to reset.

---

## 4. Defending Motion-5 — What Coaches Should Know

Section summary: This section describes the three most common defensive approaches against Motion-5 so coaches can teach their own teams how to attack the defence that is defending their Motion-5 offence.

- **Zone defence against Motion-5:** A 2-3 zone disrupts Motion-5 by removing the one-on-one coverage that makes back-cuts and drive-and-kick effective. The counter is the ZIP trigger — use high-post entries and skip passes to attack zone gaps rather than relying on drives.
- **Switching man-to-man:** Switching eliminates the advantage of screens in Motion-5. The counter is Rule 4 (screen away) applied to target the switch mismatch: when a big switches onto a guard, call the VEER trigger for the mismatch iso at the high post.
- **Packed paint (zone sag):** If the defence sags five inside the arc, Motion-5 players should ignore Rule 5's restriction and hold the ball at the arc to force defenders to come out. Only attack when a defender overextends.
