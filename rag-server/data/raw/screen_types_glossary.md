# Screen Types Glossary — Complete Reference for Off-Ball and On-Ball Screens

---

## Introduction

Section summary: This introduction explains how to use this glossary within the CoachDiary RAG system and cross-references related play family documents.

This document is a standalone reference for every major screen type used in basketball play design. Each section covers a single screen type and is fully self-contained: definition, legal setting mechanics, cutter/ball-handler reads, typical defensive reactions, when to use it in play design, and a play design tip.

Screen types are divided into two categories:
- **Off-ball screens:** set away from the ball to free a cutter or shooter.
- **On-ball screens:** set on the ball-handler's defender, leading to a pick-and-roll (P&R) or pick-and-pop (P&P).

Cross-references to play family documents:
- Half-court play families: `set_plays_horns_family.md`, `set_plays_floppy_family.md`, `set_plays_elevator_family.md`, `set_plays_dho_family.md`, `set_plays_motion5_family.md`
- Pick-and-roll offense detail: `pick_and_roll_offense.md`
- Pick-and-roll defensive coverages: `pick_and_roll_defensive_coverages.md`

---

## 0. Screen Fundamentals — How Screens Create Space

Section summary: Core principles that apply to every screen type. Understanding these allows play generation to correctly position the cutter's destination and the pass target.

### The fundamental rule: space is created BEHIND the screen

A screen blocks a defender's path. The space that opens up is always on the **side of the screener that the defender cannot reach** — behind the screener's body, opposite to where the defender is being obstructed.

```
Before the screen:         After the screen is set:
  Defender → Cutter          Screener
  [X]        [O]             [S] [X]   ← defender is blocked
                              ↑
                         [O] runs here ← OPEN SPACE behind the screen
```

The cutter must always move to the space on the **far side** of the screener from the defender. If the cutter moves to the same side as the defender, the screen provides no benefit.

### The cutter must go tight

The cutter must pass as close to the screener as possible — "shoulder to shoulder." Any gap between the cutter and the screener lets the defender slip through without being obstructed. A screen is only effective when the cutter forces the defender into the screener's body.

### Where the open space is for each screen type

| Screen type | Screener faces | Space created | Cutter exits toward |
|-------------|---------------|---------------|---------------------|
| Down screen | Away from basket (facing perimeter) | Above the screener, toward the arc | Three-point line / wing |
| Up screen | Toward basket (facing baseline) | Below the screener, toward the paint | Basket / low block |
| Back screen | Away from basket (screener's back to the paint) | Between screener and basket | Basket / lob position |
| Flare screen | Toward the arc | Beside/above the screener | Corner / wing three |
| Cross screen | Across the lane | On the opposite block | Opposite block / post |
| Ball screen (P&R) | Lateral to the ball-handler | Past the screener's hip | Drive lane / pull-up |

### Play generation rule: cutter destination = behind the screen

When generating a screen action, the cutter's path endpoint must be placed **behind the screener's final position** — on the opposite side from the defender's starting position. The pass target (where the ball goes) is that same endpoint.

Example — down screen for a north-side shooter:
- Screener final position: elbow north (x=190, y=188)
- Defender was below (y > 188), so space opens above the screener (y < 188)
- Cutter exits toward wing north (x=330, y=113) — behind the screen, above it
- Pass target: wing north (x=330, y=113)

Example — back screen for a lob cut:
- Screener final position: mid-paint (x=155, y=255)
- Defender was between screener and basket (x < 155)
- Space opens between screener and basket — cutter cuts to the rim (x=80, y=255)
- Pass target: restricted area (x=77, y=255)

### The screener always faces away from the open space

This is a direct consequence of the fundamental rule: the screener's body blocks the defender, so the screener's **back** (or side) faces the direction the cutter is going. The screener never faces the space they are creating.

---

## 1. Down Screen (Pin-Down)

Section summary: This section defines the down screen (pin-down), explains how to set it legally, how the cutter reads it, typical defensive reactions, and when to use it in play design.

### Definition

A **down screen** (also called a **pin-down**) is set by a screener who is **above** the cutter on the court. The screener moves toward the baseline, plants, and screens the cutter's defender. The cutter uses the screen and moves **toward the three-point line** (upward, away from the baseline) to receive the ball.

### How to set it legally

- The screener must be stationary with a wide base before contact with the defender.
- Screener plants their feet at approximately x:160, y:150 (right wing area) or x:160, y:360 (left wing area) to pin the defender below.
- Arms must be crossed or hands on chest — no extending elbows into the defender's path.
- The screen is set **facing** the direction the cutter will exit (toward the perimeter), so the screener's back is to the baseline.

### How the cutter reads it

The cutter (typically SG/2 or SF/3) has three reads based on how X2 defends the screen:

- **Curl:** X2 tries to follow through but gets caught on the screen — cutter curls tight around the screener and angles toward the basket (approx. x:200, y:200 on the right side). Best for catch-and-finish or pull-up.
- **Fade / Flare:** X2 goes under the screen (anticipating the curl) — cutter fades to the corner (approx. x:87, y:90 or x:87, y:420) or flares to the wing for a three-point catch-and-shoot.
- **Straight:** X2 fights over the top with tight coverage — cutter pops directly to the three-point line (approx. x:280, y:150 right wing three or x:280, y:360 left wing three) and catches on the move.

### Typical defensive reactions

- **Trail (fight over):** X2 follows the cutter over the screen — cutter should fade or straight cut.
- **Go under:** X2 ducks under the screen — cutter should curl toward the basket.
- **Switch:** X5 switches onto the cutter, X2 picks up the screener — offence should immediately look for the mismatch (the post-up screener on the smaller X2).

### When to use in play design

- When a perimeter player (SG/2 or SF/3) needs to be freed from deep in the paint or the low block.
- Late shot clock: quick down screen sets up an immediate catch-and-shoot action.
- As a pre-cursor to a DHO (dribble hand-off): screener sets the pin-down, cutter comes off, receives a DHO from the ball-handler at the wing.

### Play design tip

The down screen is the foundational screen of the **Floppy family** (see `set_plays_floppy_family.md`), where the same cutter reads two sequential down screens on opposite sides. Most effective when the screener is a credible shooting or post threat — the defence cannot afford to switch without creating a mismatch.

---

## 2. Back Screen

Section summary: This section defines the back screen, explains how to set it legally, how the cutter reads it, typical defensive reactions, and when to use it in play design.

### Definition

A **back screen** is set when the screener **turns their back to the cutter's defender** and plants perpendicular to the defender's path. The cutter uses the screen and drives **toward the basket** (backdoor cut). Back screens are high-contact screens because the defender cannot see them coming easily.

### How to set it legally

- The screener must give the defender a chance to avoid the screen — cannot sprint into the screen with speed.
- Screener sets their screen at the defender's position, not where the defender is going.
- Screener faces **away from the basket** (toward the perimeter), so their back faces the paint.
- Typical screen location: approx. x:175, y:175 (right elbow) or x:175, y:335 (left elbow), set on the X3 or X4 defender.
- Arms must be held in — back screens are prone to illegal contact calls.

### How the cutter reads it

- **Default cut (toward the basket):** Cutter (SF/3 or PF/4) uses the screen and drives toward the basket in a straight line (approx. x:80, y:255). Screener seals the defender away, creating a direct lob opportunity.
- **Read the switch:** If the defence switches, the cutter should seal the new defender on the low block and call for a post entry.

### Typical defensive reactions

- **Fighting through:** X3 fights through the screen — often results in contact and a foul on X3.
- **Switch:** X4 (screener's defender) switches onto the cutter — the screener is now guarded by the smaller X3 in the post (mismatch).
- **Hedge:** X4 shows on the cut to slow the cutter — screener slips toward the perimeter for an open catch.

### When to use in play design

- When a post player (PF/4 or C/5) sets a back screen for a perimeter cutter going to the basket — this is the lob action in many ATO plays.
- As a second action in a stagger or Spain P&R sequence.
- When a team wants a lob opportunity for an athletic wing or a cutting big.

### Play design tip

The back screen is the primary mechanism in the **Spain P&R** (see `pick_and_roll_offense.md` — Spain P&R section): a guard (SG/2 or SF/3) sets a back screen on the rolling centre's defender (X5) after the ball screen, freeing the roller for a lob. Also used in HORNS variations as a secondary action — see `set_plays_horns_family.md`.

---

## 3. Cross Screen

Section summary: This section defines the cross screen, explains how to set it legally, how the cutter reads it, typical defensive reactions, and when to use it in play design.

### Definition

A **cross screen** is set by a screener who moves **horizontally across the lane** to screen a post player's defender. The screener moves from one block to the other (or from the elbow to the opposite block) and plants on the defender's path. The cutter (typically C/5 or PF/4) uses the screen and flashes to the opposite block to receive a post entry pass.

### How to set it legally

- The screener must reach their destination and be set (stationary) before the cutter uses the screen.
- Screener moves across the lane from approx. x:87, y:210 (right block) to x:87, y:300 (left block), or vice versa.
- Screener must not push or extend — cross screens often draw illegal screen calls if the screener is moving on contact.

### How the cutter reads it

- **Default:** C/5 (cutter) waits for the screener to set the screen, then bursts across the lane (approx. path: x:87, y:210 to x:87, y:300) and posts up on the opposite block. Screener seals X5 above them.
- **Duck in:** If X5 tries to go over the screen, cutter ducks in front (between X5 and the basket) and catches at the front of the rim (approx. x:87, y:255).

### Typical defensive reactions

- **Go behind:** X5 tries to go behind the screen — cutter seals them and catches on the block.
- **Switch:** X4 switches onto C/5 — a smaller X4 must now guard C/5 on the block (mismatch inside).
- **Bump the cutter:** X5 pushes through the screen physically — this is often called a foul.

### When to use in play design

- Establishing a post-up for C/5 in motion offences.
- BLOB sets where a big (PF/4) cross-screens for the C/5 as the primary scoring action.
- As an entry action for post-dominant teams — see `set_plays_roster_variations.md`.

### Play design tip

The cross screen is most effective when the screener (PF/4) is a credible scoring threat themselves. If the defence is unwilling to switch (fear of PF/4 posting up), the cross screen will always free C/5 on the block. If the defence switches, PF/4 seals the smaller defender and calls for the post entry instead.

---

## 4. Flare Screen

Section summary: This section defines the flare screen, explains how to set it legally, how the cutter reads it, typical defensive reactions, and when to use it in play design.

### Definition

A **flare screen** is an off-ball screen set in a way that opens the cutter **away from the basket** and toward the perimeter or corner. Instead of driving the cutter toward the rim, the flare screen creates a three-point shooting opportunity as the cutter "flares" away from the help-side defenders.

### How to set it legally

- Screener sets the screen on the **baseline side** of the cutter's defender (below the defender, between the defender and the baseline), so that the cutter moves upward and outward.
- Screen location: approx. x:130, y:150 (right short corner / wing area) or x:130, y:360 (left short corner / wing area).
- Screener must be stationary before the cutter uses the screen.

### How the cutter reads it

- **Flare (default):** Cutter (SG/2 or SF/3) reads the screen and moves away from the basket — toward the wing three-point line (approx. x:280, y:113 right wing or x:280, y:397 left wing) or the corner (approx. x:87, y:90 or x:87, y:420).
- **Cut-back (when denied):** If X2 anticipates the flare and goes below the screen to cut off the three-point catch, the cutter reverses — back-cuts toward the basket for a layup (approx. x:100, y:255).

### Typical defensive reactions

- **Over the top:** X2 goes over the screen following the cutter — cutter flares wide to the corner.
- **Under the screen:** X2 goes under, allowing the cutter more space — cutter stops and catches at the three-point line.
- **Switch:** X4 or X5 switches — the screener is now guarded by a larger defender; the cutter reads whether to relocate.

### When to use in play design

- When a perimeter player needs to be freed in the corner or wing for a three-point shot.
- In Motion-5 offense (see `set_plays_motion5_family.md`) to generate off-ball shooting.
- As a secondary action in HORNS to give the weak-side corner player a shooting opportunity.

### Play design tip

The flare screen is most effective when the cutter is a **high-percentage three-point shooter** who the defence must respect at all costs. The threat of the flare opens back-cut opportunities on the same possession — a cutter who curls once and flares next time becomes extremely difficult to guard.

---

## 5. Stagger Screen

Section summary: This section defines the stagger screen, explains how to set it legally, how the cutter reads it, typical defensive reactions, and when to use it in play design.

### Definition

A **stagger screen** is a sequence of **two consecutive off-ball screens** set for the same cutter. The two screeners are positioned in a line (staggered), and the cutter passes through both screens in sequence. The cutter reads which screen to use and which action to take off that screen.

### How to set it legally

- First screener (PF/4) plants at approximately x:200, y:210 (right mid-post) or x:200, y:300 (left mid-post).
- Second screener (C/5 or SF/3) plants at approximately x:250, y:160 (right elbow-to-wing area) or x:250, y:350 (left side), staggered several steps above the first screener.
- Both screeners must be set and stationary before the cutter arrives at the first screen.
- The sequence is first screener → second screener, but the cutter may exit off either.

### How the cutter reads it

- **Default (use second screen):** Cutter (SG/2) runs through the first screen, using it to shake the defender, then fully uses the second screen to curl or flare to the three-point line (approx. x:280, y:150 or x:280, y:360).
- **Exit early (use first screen):** If X2 is trailing the first screen by two steps, the cutter curls tight off the first screen immediately (approx. x:200, y:255) and catches for a mid-range shot.
- **Reject both screens:** If both defenders fight through tightly, the cutter can backdoor between the two screeners (toward the basket, approx. x:100, y:255).

### Typical defensive reactions

- **Switch:** The two defenders switch assignments between the screeners — cutter reads and identifies the weakest matchup, or cuts away from both.
- **Trail tightly:** Both defenders fight through — cutter curls off whichever screen catches the first defender.
- **Zone help:** Zone defences can sag and take away the stagger entirely — stagger screens are less effective vs. zone.

### When to use in play design

- In the **Floppy family** (see `set_plays_floppy_family.md`) — the floppy play is essentially a stagger action off two screeners on one side.
- Whenever a shooter (SG/2) needs to be freed from a strong on-ball defender — the cumulative effect of two screens gives the cutter more room.
- ATO plays (after timeout) where a quick three-point attempt is needed — stagger screens generate open looks faster than single screens.

### Play design tip

Stagger screens are most effective when the two screeners are different physical types (e.g., a big C/5 sets the first screen and an athletic SF/3 sets the second) so the switching assignment is uncomfortable for the defence. The cutter should vary exit points across possessions to prevent the defence from anticipating the curl.

---

## 6. Double Screen

Section summary: This section defines the double screen, explains how to set it legally, how the cutter reads it, typical defensive reactions, and when to use it in play design.

### Definition

A **double screen** is formed by **two screeners standing side by side** (shoulder to shoulder) to create a wide barrier for the cutter. Unlike a stagger screen (sequential), a double screen presents both options simultaneously. The cutter reads which side of the double screen to use.

### How to set it legally

- Two screeners (PF/4 and C/5, or PF/4 and SF/3) stand side by side at a set location, typically near the elbow or the foul line (approx. x:175, y:220 and x:175, y:290 — side by side at the key).
- Neither screener may push or move into the defender's path — both must be stationary simultaneously.
- The gap between screeners should be approximately 0.5 to 1 body width — enough for the cutter to commit to one side.

### How the cutter reads it

- **Go right side of the double:** If the right-side defender (X2) is trailing, cutter uses the right screener and exits to the right wing (approx. x:280, y:150).
- **Go left side of the double:** If the left-side defender (X2) is in front, cutter reverses and uses the left screener (approx. x:280, y:360).
- **Read the switch:** If the defence switches, the cutter identifies which screener has been switched to a smaller defender and immediately calls for the post entry or isolation.

### Typical defensive reactions

- **Switch:** Most common against a double screen — both screener defenders switch onto each other's assignments. This creates potential mismatches.
- **One goes over, one goes under:** One defender fights over while the other dips under — the cutter reads the gap and exits off the path-of-least-resistance side.

### When to use in play design

- Late-clock situations where a shooter (SG/2) needs a quick catch-and-shoot on a specific side.
- BLOB and SLOB plays where the defence is pre-set and a double screen creates an immediate shooting opportunity.
- As a variation of the stagger when the coach wants the exit direction left to the cutter's read rather than pre-determined.

### Play design tip

Double screens are most effective in **BLOB sets** (baseline out of bounds — see `set_plays_zone_specific.md`) where space is tight and the defence cannot switch easily without creating a mismatch. The double screen's width also makes it effective in zone offences, where zone defenders cannot follow the cutter through multiple bodies.

---

## 7. Elevator Screen (Closing Doors)

Section summary: This section defines the elevator screen (closing doors), explains how to set it legally, how the cutter reads it, typical defensive reactions, and when to use it in play design.

### Definition

The **elevator screen** (also called "closing doors") is a two-screener action where two screeners stand shoulder to shoulder with a **gap between them** — like open elevator doors. The cutter runs through the gap at full speed. As the cutter passes through, the screeners step together ("close the doors"), trapping the chasing defender between them. The cutter exits on the other side into an open catch-and-shoot opportunity.

### How to set it legally

- Two screeners (typically PF/4 and C/5, or C/5 and SF/3) stand at approximately x:230, y:205 and x:230, y:305 — a gap of approximately 100 pixels (one body width) at the top of the key or above the free-throw line.
- The key legal requirement: screeners must not move into the defender's path after they are set. They must be stationary before the cutter enters the gap.
- "Closing" means the screeners step **together** after the cutter passes through — they step inward, not toward the defender.
- Screeners step to meet each other (approx. x:230, y:255 final position), not toward the defender's path.

### How the cutter reads it

- **Default:** Cutter (SG/2 or SF/3) runs from the weak side at full speed toward the gap (entering at approx. x:330, y:255). The cutter times the run so they pass through just before the "doors close."
- **On exit:** Cutter receives the pass immediately on the other side of the elevator at the three-point line (approx. x:280, y:150 or x:280, y:360 depending on exit angle) and shoots.
- **If denied:** The cutter can flash to the top of the key (approx. x:280, y:255) if the defender anticipates the elevator and the doors close before the cutter arrives.

### Typical defensive reactions

- **Trail over:** X2 tries to trail the cutter through the gap — the closing doors catch X2 in the screen, leaving the cutter wide open.
- **Go under:** X2 dips under both screeners — the cutter exits with even more space.
- **Switch:** One of the screener's defenders switches onto the cutter — this is the most effective defensive counter. The result is a larger defender on the perimeter (possibly a mismatch if X4 or X5 is now on SG/2).
- **Zone hedge:** Zone defences sag into the gap before the cutter enters — elevator screens are less effective against zone.

### When to use in play design

- End-of-quarter or ATO situations where a catch-and-shoot three is needed immediately — the elevator generates the highest-quality three-point looks in basketball.
- Against trailing defences that fight over screens — the closing door makes fighting over impossible.
- For elite three-point shooters (SG/2 or SF/3) who can shoot off the catch instantly.

### Play design tip

The elevator screen is the defining action of the **Elevator play family** (see `set_plays_elevator_family.md`). The entire play is designed to create one high-quality elevator exit for the cutter. It is most effective when the same cutter uses a curl or down screen earlier in the possession — the defender, conditioned to fight over, will be perfectly positioned to get caught by the closing doors.

---

## 8. Blind Screen

Section summary: This section defines the blind screen, explains how to set it legally, how the cutter reads it, typical defensive reactions, and when to use it in play design.

### Definition

A **blind screen** is a screen set from **outside the defender's field of vision** — approaching from behind or from the side where the defender cannot see the screener coming. Blind screens create the highest contact likelihood of any screen type and must be set with particular attention to legality.

### How to set it legally

- Because the defender cannot see the screen being set, the screener **must give the defender the opportunity to see them** or must be stationary enough in advance that the collision is the defender's responsibility.
- Legal blind screens: screener plants well in advance (2+ seconds before the cutter uses the screen) in a stationary, wide-based stance.
- Illegal blind screens: screener sprints into position at the last second — this is a moving screen/charge and will be called.
- Location: depends on the play, but a common blind screen position is at the weak-side elbow (approx. x:175, y:175 or x:175, y:335) on a cutting big.

### How the cutter reads it

- **Default:** The cutter (SF/3 or PF/4) calls for the screen (verbal or hand signal) and makes a move-away fake before using the screen. This freezes the defender's vision, making the blind screen even more effective.
- **After the screen:** The cutter attacks the basket (approx. x:80, y:255) at full speed since X3 or X4 cannot recover quickly having been blindsided.

### Typical defensive reactions

- **Bump the cutter:** X3 tries to bump the cutter's path before the screen — illegal if excessive, but often goes uncalled.
- **Zone awareness:** Experienced defenders learn to scan for blind screens — the screen loses its effectiveness against attentive defenders.
- **Switch call:** Only effective if the screener's defender anticipates the switch before contact.

### When to use in play design

- In ATO or BLOB sets where a quick basket cut is needed — a blind screen on the weakest help-side defender creates an immediate lob or direct pass opportunity.
- As an interior action within Motion-5 offense when cutters are moving without the ball.
- Sparingly — overuse of blind screens leads to illegal screen calls as referees become attentive.

### Play design tip

The blind screen is most effective when set by a larger player (PF/4 or C/5) on a smaller help-side defender (SG/2 guarding the roll area). The size mismatch in the screen means the defender physically cannot get through even if they see it coming. Use it in combination with a skip pass action to exploit the weak-side help collapsing.

---

## 9. Ball Screen (On-Ball Screen / Pick)

Section summary: This section defines the ball screen (pick), explains how to set it legally, how the ball-handler reads it, typical defensive reactions, and when to use it in play design.

### Definition

A **ball screen** (also called an **on-ball screen** or **pick**) is a screen set directly on the **ball-handler's defender (X1)**. Unlike off-ball screens, the ball screen creates a direct two-man game: the ball-handler (PG/1) reads their defender and the screener's defender simultaneously, leading to a pick-and-roll (P&R) or pick-and-pop (P&P) action.

### How to set it legally

- Screener (C/5 or PF/4) moves to set the screen at the ball-handler's position and must be **completely stationary** before X1 makes contact.
- Screener sets a wide base — feet beyond shoulder-width, knees bent, arms crossed or held on chest.
- Screener must not lean into X1 or extend elbows — any movement after being set is a moving screen.
- Common screen locations:
  - Top of the key: approx. x:230, y:255
  - Wing/side: approx. x:200, y:150 (right) or x:200, y:360 (left)
  - High ball screen above the three-point line: approx. x:310, y:255

### How the ball-handler reads it

See `pick_and_roll_offense.md` for the full detailed breakdown. Summary of reads:

- **Turn the corner:** Drive paint when X1 is late and X5 drops.
- **Pull-up:** Shoot the gap when X5 drops back.
- **Reject:** Go opposite when X1 over-commits over the screen.
- **Lob:** Pass over X5 when X5 hedges high and the roll is open.

### Typical defensive reactions

See `pick_and_roll_defensive_coverages.md` for full coverage breakdowns:

- Drop, Hedge/Show, Switch, ICE/Blue, Blitz/Trap.

### When to use in play design

- The ball screen is the most versatile and widely-used action in all levels of basketball.
- Use it to initiate P&R actions in HORNS, DHO chains, and Motion-5 sets.
- Use it in ATO plays to create immediate shot opportunities off the roll or the pull-up.
- Reference: see `set_plays_horns_family.md` and `set_plays_dho_family.md` for play contexts.

### Play design tip

The ball screen's effectiveness multiplies when paired with proper spacing. Corner shooters at approx. x:87, y:90 and x:87, y:420, and a weak-side wing at approx. x:330, y:113 ensure that any help defender abandoning their assignment to double-team the P&R leaves an open shooter. Never run a ball screen with off-ball players inside the three-point arc — it collapses the advantage.

---

## 10. Spain Screen (Spain Pick-and-Roll)

Section summary: This section defines the Spain screen, explains how to set it legally, how the cutter reads it, typical defensive reactions, and when to use it in play design.

### Definition

The **Spain screen** (also called the **Spain P&R**) is a combination action: a **ball screen** by C/5 on the ball-handler's defender (X1) is immediately followed by a **back screen** on the rolling C/5's defender (X5), set by a third player (SG/2 or SF/3). The result is that C/5 rolls to the basket with no one guarding them — the classic Spain P&R lob.

### How to set it legally

- **Ball screen (C/5 on X1):** C/5 sets the ball screen at approximately x:220, y:255 (top of key). Standard ball screen rules apply — stationary, wide base, no movement on contact.
- **Back screen (SG/2 or SF/3 on X5):** As C/5 rolls, SG/2 sets a back screen on X5 at approximately x:155, y:255. The back screen must be stationary before X5 makes contact. The screener faces away from the basket (toward PG/1), with X5 behind them.
- Timing is critical: the back screen must be set **simultaneously with C/5's roll**, not before, to prevent X5 from going around it.

### How the cutter reads it

- **C/5 (roller):** After setting the ball screen, C/5 rolls immediately toward the basket (approx. path: x:220, y:255 → x:80, y:255). The back screen on X5 creates a direct lane. C/5 looks up immediately for the lob.
- **PG/1 (ball-handler):** Uses the ball screen, hesitates to force X5 to commit to the hedge or drop, then delivers the lob pass over X5 to C/5 at the rim.
- **SG/2 (back-screener):** After setting the back screen on X5, SG/2 is temporarily free — if C/5 is not open for the lob, SG/2 can slip to an open spot at the wing (approx. x:280, y:150) as a secondary option.

### Typical defensive reactions

- **Switch (X2 onto C/5, X5 stays on PG/1):** A two-switch or three-switch is needed — teams will try to switch all three actions simultaneously. The offence counters by hunting the mismatch: a small X2 guarding C/5 in the post.
- **Zoning the Spain:** Some teams send X5 below the back screen and have X2 come all the way over — this complex scheme requires pre-planned adjustment and is rarely executed cleanly.
- **Blitz the ball-handler:** Double-trapping PG/1 at the ball screen — but with the back screen, C/5 is still open on the roll even if PG/1 is trapped.

### When to use in play design

- Against teams that play drop coverage on standard P&R — the Spain screen punishes the dropping X5 by physically screening them off the roll path.
- ATO plays where a direct lob attempt is the primary objective.
- When C/5 is an above-the-rim finisher (athletic lob threat) and SG/2 or SF/3 is capable of setting a physical back screen.

### Play design tip

The Spain screen is most effective against drop and hedge coverages (see `pick_and_roll_defensive_coverages.md`). It requires a third player who is willing to set a dirty back screen — a role often assigned to SF/3 or SG/2. The ball-handler (PG/1) must be patient: the lob pass is the highest-percentage option but requires waiting for the back screen to make contact. A ball-handler who rushes the pass before X5 is screened will find X5 in the passing lane. For the full P&R framework, see `pick_and_roll_offense.md`.
