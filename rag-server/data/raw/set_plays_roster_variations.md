# Set Plays — Roster-Type Variations

## 1. Roster-Type Play Selection Framework

Section summary: The most effective plays are those that leverage your team's best players — this section maps two distinct roster archetypes (dominant post roster and perimeter-heavy roster) to their most effective play families, with specific play adaptations for each.

No roster is identical. Before selecting a playbook, identify which of the two primary roster archetypes best describes your team. Mixed rosters should read both sections and select plays from both, then prioritise based on the team's single best offensive asset.

---

## 2. Plays for a Dominant Post Roster

Section summary: A dominant post roster has a center (C / 5) or power forward (PF / 4) who is significantly more skilled than their defender in the post; all plays in this section are designed to get the post player the ball in a high-percentage position and create secondary threats from their catch.

**Roster characteristics:**
- Center (C / 5) or Power Forward (PF / 4) scores reliably from the low block: drop step, jump hook, up-and-under, and short jumper.
- Perimeter players are capable passers and cutters but may not be elite three-point shooters.
- The post player can also pass out of double-teams — they have at least two or three assists per game from the post.

**Strategic principle:** Get the dominant post the ball early in the shot clock at the position of their choosing (usually the preferred block — most players have a dominant side). Every play should occupy the defence for long enough that the post entry becomes a clean two-on-one read, not a defended catch.

---

### Play POST-01: HIGH-LOW POST ENTRY

Section summary: HIGH-LOW POST ENTRY uses the power forward at the high post to split the defence and deliver a two-handed overhead pass to the center on the block — defeating both fronting and behind coverage with a single action.

**Primary option → Counter → Safety valve**

- **Step 1 — Setup:** Power forward (PF / 4) positions at the high post / free-throw line (approx. `{x: 280, y: 255}`). Center (C / 5) posts up on the strong-side block — preferred side, let the center choose; use south block `{x: 145, y: 323}` as default. Point guard (PG / 1) at top `{x: 370, y: 255}`. Shooting guard (SG / 2) and Small forward (SF / 3) on opposite wings for spacing.

- **Step 2 — High-post entry:** PG (1) passes to PF (4) at the high post. X4 must now engage PF (4). X5 simultaneously must decide: play in front of C (5), play behind, or three-quarter.

- **Primary option — C (5) open behind:** If X5 plays behind C (5), PF (4) delivers a two-handed overhead pass directly to C (5)'s hands at the block (approx. `{x: 145, y: 323}`). C (5) catches in a strong post stance and scores immediately: drop step, jump hook, or up-and-under. Path: PF pass to C; C shoot.

- **Counter A — C (5) fronted:** If X5 fronts C (5) (positions between C and the ball), PF (4) holds for one beat. SF (3) on the weak side sets a back-screen on X5. C (5) seals X5 on the back and flashes to the ball-side block for a lob from PF (4). Path: SF cut (screen on X5); C cut to block; PF lob pass to C; C finish.

- **Counter B — PF (4) mid-range:** If both X4 and X5 sag to stop the C (5) post, PF (4) shoots the mid-range jumper from the free-throw line (approx. `{x: 280, y: 255}`). Path: PF shoot.

- **Counter C — Perimeter skip:** If the entire defence collapses toward the post, PF (4) skips to SG (2) on the weak-side wing (approx. `{x: 330, y: 113}`) for an open three. Path: PF skip pass to SG; SG shoot.

- **Safety valve:** PG (1) at the top of the key (approx. `{x: 370, y: 255}`) is always available for PF (4) to reverse and reset.

---

### Play POST-02: PERIMETER CLEAR SIDE POST ISO

Section summary: PERIMETER CLEAR SIDE POST ISO removes all four perimeter players from the strong side and allows the center to post up one-on-one without double-team triggers, exploiting the gap between the post player's skill and their defender's.

**Primary option → Counter → Safety valve**

- **Step 1 — Clear side action:** PG (1) passes to SG (2) on the north wing. PG cuts through to the south corner (approx. `{x: 87, y: 438}`). SF (3) fills the south wing `{x: 330, y: 398}`. PF (4) pops to the north corner `{x: 87, y: 73}`. The entire north side is cleared for C (5) at the north block (approx. `{x: 145, y: 188}`).

- **Step 2 — Entry pass:** SG (2) enters the ball to C (5) on the north block. No other player is within help-side distance on the north side.

- **Primary option — C (5) one-on-one post:** C (5) reads X5's position and attacks:
  - X5 playing behind: C (5) catches and turns immediately. Middle or baseline drop step.
  - X5 three-quartering toward baseline: C (5) drop steps to the middle.
  - X5 fronting: SG (2) holds for C (5)'s flash to the high post for a pass-and-post reset.
  Path: SG pass to C; C post move shoot.

- **Counter — Double-team trigger:** If a second defender helps (X1 or X3), C (5) passes to the open perimeter player: PF (4) at the north corner (approx. `{x: 87, y: 73}`) or PG (1) at the south corner (approx. `{x: 87, y: 438}`). Path: C kick-out to corner; corner player shoots three.

- **Safety valve:** SG (2) calls a set play verbally if C (5) cannot get the ball into a scoring position within five seconds. SG reverses to PG (1) at the south wing to reset.

---

### Play POST-03: CURL AND POST SEAL

Section summary: CURL AND POST SEAL uses a perimeter cut to draw the post defender's attention away from the block, creating a clean post entry immediately after the defender's attention shifts.

**Primary option → Counter → Safety valve**

- **Step 1 — Setup:** C (5) on the strong-side block (south block, `{x: 145, y: 323}`). PF (4) at the weak-side elbow `{x: 190, y: 188}`. SG (2) on the south wing `{x: 330, y: 398}`.

- **Step 2 — Curl action:** PG (1) passes to SG (2). PG (1) immediately cuts off PF (4)'s down-screen (PF screens toward the baseline). PG (1) curls toward the basket (approx. `{x: 90, y: 255}`).

- **Step 3 — Defensive attention shift:** X5 must decide whether to help on PG (1)'s curl cut or stay on C (5)'s block. If X5 helps: post entry is open. If X5 stays: PG (1)'s curl is open.

- **Primary option — Post entry to C (5):** SG (2) enters the ball to C (5) on the block the moment X5's attention is divided. C (5) receives in a strong post position and scores. Path: SG post-entry pass to C; C shoot.

- **Counter A — Curl open:** If X5 fully abandons C (5) to stop PG (1)'s curl, SG (2) lobs to C (5) for an easy basket before the post entry is even required. Path: SG lob pass to C; C finish.

- **Counter B — PF short roll:** If help is slow, PF (4) short-rolls after setting the screen and receives a pass from SG (2) at the elbow for a high-percentage mid-range shot. Path: SG pass to PF at elbow; PF shoot.

- **Safety valve:** PG (1) pops to the three-point arc after the curl (if not open on the curl) and receives SG (2)'s pass to reset.

---

## 3. Plays for a Perimeter-Heavy Roster

Section summary: A perimeter-heavy roster has multiple players who can shoot from the three-point arc and handle the ball in space but lacks a dominant post presence; all plays in this section are designed to create catch-and-shoot opportunities through spacing, screens, and ball movement rather than post isolation.

**Roster characteristics:**
- Multiple players (SG / 2, SF / 3, PF / 4) shoot above 35% from three-point range.
- The center (C / 5) may not be a scoring threat but can set screens, roll hard, and shoot from 15 feet.
- The point guard (PG / 1) is a strong ball-handler who can create off the dribble.
- The team wins by outscoring opponents from beyond the arc rather than dominating in the paint.

**Strategic principle:** Maximum spacing across the three-point arc on every possession. Never allow two players to occupy the same zone. Generate open catch-and-shoot opportunities through movement, screening, and drive-and-kick rather than isolation or post play.

---

### Play PERI-01: FIVE-OUT SKIP ATTACK

Section summary: FIVE-OUT SKIP ATTACK places all five players on the three-point arc and uses ball reversal skip passes to move the defence, then attacks the gap created by a trailing help defender.

**Primary option → Counter → Safety valve**

- **Step 1 — Five-out alignment:** All five players beyond the three-point arc.
  - PG (1): `{x: 370, y: 255}` — top, ball-handler
  - SG (2): `{x: 330, y: 113}` — north wing
  - SF (3): `{x: 330, y: 398}` — south wing
  - PF (4): `{x: 87, y: 73}` — north corner
  - C (5): `{x: 87, y: 438}` — south corner

- **Step 2 — Ball reversal (one side to other):** PG (1) passes to SG (2) on the north wing. SG (2) immediately skips to PF (4) in the north corner. Two rapid passes — the south-side zone defenders are now out of position.

- **Step 3 — Attack the over-helping defender:** PF (4) catch-and-shoots from the north corner if X4 is late. If X4 is on time, PF (4) drives baseline or reverses to PG (1).

- **Primary option — PF (4) catch-and-shoot:** PF (4) shoots the north corner three immediately off the skip pass. Path: SG skip pass to PF; PF shoot.

- **Counter — Drive-and-kick to C (5):** PF (4) drives baseline and draws X5 from the south corner. C (5) is now open in the south corner (approx. `{x: 87, y: 438}`). PF (4) passes to C (5) for an open three. Path: PF drive; pass to C; C shoot.

- **Counter B — PG drives empty lane:** If all help defenders have shifted to cover PF's actions, PG (1) attacks the top of the key against a single on-ball defender with no help side. Path: PG dribble drive; finish or pull-up.

- **Safety valve:** SF (3) at the south wing (approx. `{x: 330, y: 398}`) is available for a reversal if no shot is created.

---

### Play PERI-02: STAGGER-SCREEN SHOOTER LIBERATION

Section summary: STAGGER-SCREEN SHOOTER LIBERATION uses two sequential off-ball screens to free the team's best three-point shooter from the perimeter, creating a catch-and-shoot opportunity that cannot be denied without defensive switching (which creates its own mismatch).

**Primary option → Counter → Safety valve**

- **Step 1 — Wing entry:** PG (1) passes to SF (3) on the south wing (approx. `{x: 330, y: 398}`). PG relocates to the top as safety valve.

- **Step 2 — Stagger screens:** C (5) moves to the south low block (approx. `{x: 145, y: 323}`). PF (4) positions at the south elbow (approx. `{x: 190, y: 323}`). Together C and PF form a stagger — C's screen first (at the block), PF's screen second (at the elbow) — aimed at freeing SG (2) who starts in the south corner (approx. `{x: 87, y: 438}`).

- **Step 3 — SG's stagger cut:** SG (2) cuts from the south corner upward through C (5)'s block screen first, then continues up the lane through PF (4)'s elbow screen. SG (2) pops to the north wing (approx. `{x: 330, y: 113}`) or top of the key (approx. `{x: 370, y: 255}`).

- **Primary option — SG catch-and-shoot:** SF (3) delivers a pass to SG (2) at the top of the key or north wing for a three-point attempt. Path: SF pass to SG; SG shoot.

- **Counter A — Backdoor:** If X2 cheats over C (5)'s low screen to cut off SG, SG (2) rejects the screen and cuts backdoor toward the basket. C (5) seals X2 for a lob from SF (3). Path: SG cut backdoor; SF lob pass to SG.

- **Counter B — Switch mismatch:** If the defence switches the stagger, a smaller guard is now on PF (4). PF (4) immediately posts the guard up for a post-entry advantage. Path: SF post-entry pass to PF; PF post move.

- **Counter C — DHO continuation:** If no advantage is created, PF (4) sets a DHO for SG (2) at the elbow, creating a secondary scoring read. Path: PF DHO to SG; SG attacks or shoots.

- **Safety valve:** PG (1) at the top of the key (approx. `{x: 370, y: 255}`) receives a reversal from SF (3) to reset.

---

### Play PERI-03: DRIVE-AND-KICK CHAIN

Section summary: DRIVE-AND-KICK CHAIN exploits a perimeter-heavy roster's ball-handling depth by programming a sequential drive-and-kick sequence — if the first driver draws two defenders, the kick-out receiver also has a drive window before a third defender recovers, creating a chain of high-percentage decisions.

**Primary option → Counter → Safety valve**

- **Step 1 — Five-out alignment:** Same as PERI-01 — all five players on the arc.

- **Step 2 — First drive:** PG (1) attacks from the top of the key toward the paint (one dribble pull-up or layup drive). If one defender steps up to help, PG (1) kicks to the open wing.

- **Primary option — Kick to SG (2) for three:** PG (1) drives and the first help defender (X4) steps up. North wing is open. PG kicks to SG (2) on the north wing (approx. `{x: 330, y: 113}`) for a catch-and-shoot three. Path: PG dribble; pass to SG; SG shoot.

- **Counter — Second drive:** If SG (2) catches but X2 recovers quickly, SG (2) immediately drives off the catch before the defence resets. SF (3) is on the south wing as the next kick recipient. Path: SG dribble drive; pass to SF or finish.

- **Counter B — Corner reversal:** If both SG and the wing are closed, the original driver (PG) has relocated to the opposite corner (approx. `{x: 87, y: 73}`). The ball swings back to PG for a catch-and-shoot three on the weak side.

- **Safety valve:** C (5) at the south corner (approx. `{x: 87, y: 438}`) is never involved in the drive chain and is always available as the last resort kick-out.
