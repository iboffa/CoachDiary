# Pick-and-Roll Offense — Complete Offensive Reference

---

## 0. Play Generation Rules (CoachDiary canvas)

Section summary: These rules define exactly how to draw pick-and-roll paths on the CoachDiary canvas.

A pick-and-roll has TWO phases. Each phase contains a path for the ball-handler AND a path for the screener.

**Phase 1 — Setup:**
- Screener (actionType: "screen"): moves from their starting spot to the screen-setting position.
  - Top P&R screen position: x=230, y=255 (between the ball-handler and the basket).
  - Wing P&R screen position: x=200, y=165 (right side) or x=200, y=345 (left side).
- Ball-handler (actionType: "dribble"): dribbles TOWARD the screen — the final waypoint must be immediately behind the screen, not at the top of the key.
  - Top P&R example final waypoint: x=255, y=255 (just above the screen).

**Phase 2 — Action:**
- Ball-handler (actionType: "dribble"): drives past/behind the screen — turns the corner toward the paint, or pulls up at the elbow.
  - Turn-corner final position: x=130–150, y=188–220 (elbow / paint entry).
  - Pull-up final position: x=200, y=255 (high post).
- Screener roll (actionType: "cut"): rolls hard to the basket from the screen position.
  - Roll final position: x=80, y=255 (at the rim).
- Screener pop: place them at a wing/corner in phase 2's playerPositions; no separate path needed unless a pass is thrown.

**Critical check:** the ball-handler's Phase 1 endpoint and Phase 2 startpoint must both be near the screen position. A ball-handler who stays at x=370 throughout the play has NOT used the screen.

---

## 1. What Is a Pick-and-Roll

Section summary: This section defines the pick-and-roll, explains why it is effective, and identifies the two primary roles involved.

The **pick-and-roll (P&R)** — also called the ball screen or pick-and-roll action — is a two-man action in which one offensive player (the **screener**, typically the power forward (PF/4) or centre (C/5)) sets a moving screen on the ball-handler's primary defender, while the **ball-handler** (typically the point guard (PG/1) or shooting guard (SG/2)) uses that screen to attack the defence.

### Why it is effective

- It forces two defenders to guard two offensive players simultaneously, creating a numerical and positional advantage.
- It is positionless — any two players can execute it, making it hard to scout.
- It creates immediate reads: the ball-handler attacks space while the screener dives or spaces, guaranteeing one of them will be open if the defence can only cover one.
- It generates paint touches, free-throw opportunities, and open corner threes simultaneously.

### Key roles

**Ball-handler (PG/1 or SG/2):**
- Initiates the action by dribbling toward the screen.
- Reads the defender's positioning and the coverage before and after using the screen.
- Must "set up" their defender (use a change-of-pace or jab step) before contacting the screen.

**Screener (PF/4 or C/5):**
- Sets a legal, wide-based stationary screen on the ball-handler's defender (X1).
- Reads the defence's second action (roll, pop, or slip) before the screen is fully set.
- Must not move or extend elbows until after the ball-handler has used the screen.

---

## 2. Ball-Handler Reads

Section summary: This section details the four primary reads the ball-handler must make when using a pick-and-roll, and the correct action for each defensive coverage.

The ball-handler (PG/1) reads the screen-defender's (X5's) positioning and the on-ball defender's (X1's) position to choose among four options.

### Read 1 — Turn the corner (attack the paint)

- **When:** X1 goes under the screen or fights through late; X5 drops back (drop coverage).
- **Action:** PG/1 uses the screen and accelerates hard to the basket, aiming for the paint near the charge circle (approx. x:120, y:255).
- **Goal:** Draw the defence, finish at the rim, or create a kick-out pass.

### Read 2 — Pull-up (mid-range or three-point shot)

- **When:** X5 drops low (drop coverage) and the ball-handler has space above the level of the screen.
- **Action:** PG/1 comes off the screen and elevates immediately for a pull-up jumper from approximately the top of the key (approx. x:200, y:255) or the elbow (approx. x:175, y:175 for the right elbow; approx. x:175, y:335 for the left elbow).
- **Goal:** Punish the drop defender by shooting over their cushion.

### Read 3 — Reject the screen (go opposite)

- **When:** X1 goes over the top of the screen aggressively, trying to deny the ball-handler the screen.
- **Action:** PG/1 rejects the screen — changes direction before reaching it, driving in the opposite direction while the screener opens up (pivots) to face the ball.
- **Position:** PG/1 attacks middle or baseline to the open side (approx. x:140, y:180 or x:140, y:330).
- **Goal:** Use X1's over-aggressive positioning against them by going away.

### Read 4 — Lob (when the big hedges hard and the roller is open)

- **When:** X5 steps out high to hedge/show on the ball-handler, leaving the screener's roll path unguarded.
- **Action:** PG/1 throws a lob pass directly over X5 to the rolling screener (C/5) who is diving toward the basket (approx. x:80, y:255 near the hoop area).
- **Coaching cue:** "If they show high, throw it high."

---

## 3. Screener Reads — Roll vs. Pop vs. Slip

Section summary: This section describes the three options available to the screener (C/5 or PF/4) after setting the ball screen, and the defensive cues that determine which action to take.

### Roll (dive to the basket)

- **When to roll:**
  - X5 (screener's defender) hedges high or switches onto the ball-handler, vacating the lane.
  - X5 tries to trap the ball-handler at the screen (blitz), leaving the roll path open.
- **Execution:**
  - After contact with X1, C/5 pivots on the foot closest to the basket and rolls hard to the rim.
  - C/5 keeps inside hand up as a target (approx. path: screen location → x:80, y:255).
  - Looks for the lob, the bounce pass in the lane, or the direct pass at the rim.
- **Coaching cue:** "Seal on the roll — get between X5 and the basket."

### Pop (step out to the three-point line)

- **When to pop:**
  - X5 drops back in drop coverage, staying near the paint — the roll lane is crowded.
  - C/5 is a capable three-point shooter (stretch big/4 or PF/4 with shooting range).
- **Execution:**
  - After contact, C/5 steps back toward the three-point line rather than rolling.
  - Target location: top of the key three (approx. x:280, y:255) or short corner (approx. x:160, y:120 on the right; approx. x:160, y:390 on the left).
- **Coaching cue:** "If they give you the three, make them pay from distance."

### Slip (early release before the screen is set)

- **When to slip:**
  - X5 is cheating — jumping to cover the roll lane before the screen is even set (anticipating the roll).
  - The defence is switching and the switch is happening early.
- **Execution:**
  - C/5 reads X5 cheating and releases early, cutting directly to the basket without setting the screen.
  - PG/1 must anticipate: the slip is a timing-dependent read; eye contact or a predetermined signal helps.
  - C/5 finishes at the rim (approx. x:54, y:255 — at the hoop).
- **Coaching cue:** "Don't set a screen for a defender who's already moved — slip it."

---

## 4. Timing and Spacing Requirements

Section summary: This section explains where the three off-ball players must stand to maintain proper spacing during a pick-and-roll, with pixel coordinate hints for each position.

For a two-man P&R action to work, the three **off-ball players** (SF/3, SG/2, and the non-screening big) must occupy the perimeter to keep the paint clear for the roll and the drive.

### Required spacing positions

- **Strong-side corner shooter (SG/2 or SF/3):** stationed in the corner on the ball side (approx. x:87, y:73 for north corner; approx. x:87, y:438 for south corner). Provides a kick-out option if X2 or X3 helps on the drive.
- **Weak-side wing (SF/3 or SG/2):** stationed on the weak-side wing (approx. x:330, y:113 for right wing; approx. x:330, y:397 for left wing). Provides a skip pass option if the weak-side defender collapses.
- **Weak-side corner (PF/4 — the non-screener, or SF/3):** stationed in the opposite corner (approx. x:87, y:438 for south corner). Stretches the defence to its widest point.

### Spacing rules

- No off-ball player should be inside the three-point arc unless executing a cut.
- Minimum horizontal spacing of ~120 pixels between any two perimeter players prevents defensive help from being close to two threats simultaneously.
- If C/5 rolls, PF/4 must immediately pop or relocate to maintain four-man perimeter coverage.
- Off-ball cutters should only cut when they are certain their defender is helping on the P&R, not as a default action.

### Why spacing matters

- A clogged paint forces the roller (C/5) to stop short or pass out, neutralising the P&R advantage.
- Wide corner spacing (x:87 on each side) forces corner defenders to make a genuine choice between defending the corner or helping on the drive.

---

## 5. Common P&R Locations and Their Trade-offs

Section summary: This section describes three common pick-and-roll locations on the half-court, their geometric advantages, and specific trade-offs for play design.

### Top-of-the-key P&R

- **Location:** Screen set at approximately x:230, y:255 (slightly below the top of the key circle).
- **Ball-handler position at usage:** PG/1 receives the screen at approx. x:230, y:255, with the option to go either direction.
- **Advantages:**
  - Maximum space in both directions — ball-handler can attack left or right.
  - Roll path to the basket is the most direct (straight line to x:54, y:255).
  - Difficult to ICE or sideline because neither sideline is nearby.
- **Trade-offs:**
  - Exposed to hedge/show coverage because the lane to both elbows is wide open for X5 to step into.
  - Requires strong two-way ball-handler who can read both sides.

### Side P&R / Wing P&R

- **Location:** Screen set at approximately x:200, y:150 (right side) or x:200, y:360 (left side).
- **Ball-handler position at usage:** PG/1 comes off the screen from the wing.
- **Advantages:**
  - Sideline proximity limits the ball-handler's escape routes, but also limits X5's hedge angles.
  - Angles the roll toward the mid-post, creating a short catch opportunity for C/5 at approx. x:130, y:200.
  - Easier to execute the "ICE/Blue" defensive counter from the offence's perspective (offence can anticipate it and counter).
- **Trade-offs:**
  - Less space on the strong side if the ball-handler turns the corner.
  - ICE/Blue defence (forcing baseline) is most effective here.

### Spain P&R (Spain Pick-and-Roll)

- **Location:** Primary ball screen set at approximately x:220, y:255 (top of key), with a **back-screen** set on the roller's defender (X5) by a second screener (SF/3 or SG/2) positioned at approx. x:155, y:255.
- **Execution sequence:**
  1. PG/1 dribbles into a standard top-of-key ball screen set by C/5 (approx. x:220, y:255).
  2. Simultaneously, SF/3 sets a back-screen on X5 at the moment C/5 begins to roll.
  3. C/5 uses the back-screen to free themselves for a direct catch at the rim (approx. x:54, y:255).
  4. PG/1 throws the lob or direct pass to the rolling C/5.
- **Advantages:**
  - The back-screen on X5 physically prevents the drop defender from recovering to the roll.
  - Two screens on two defenders simultaneously — one defence must break down.
- **Trade-offs:**
  - Requires precise timing: back-screen must hit X5 exactly as C/5 rolls.
  - If the defence switches all three actions, it may require a third read.
  - Most effective against drop coverage or hedge coverage — less effective against switching teams.

---

## 6. Countering Each Defensive Coverage

Section summary: This section provides a direct counter for the ball-handler and screener against each of the five major pick-and-roll defensive coverages.

### vs. Drop Coverage

- **Defence:** X5 drops back to protect the paint; X1 fights over the screen.
- **Ball-handler counter:** PG/1 uses the screen and immediately pulls up for the mid-range or three-point shot (approx. x:200, y:255). X5 cannot close out in time.
- **Screener counter:** C/5 pops to the three-point line if they are a shooter, stretching X5 even further.
- **Key cue:** "Find the gap — shoot over the cushion."

### vs. Hedge / Show Coverage

- **Defence:** X5 steps out aggressively to cut off PG/1; X1 recovers back around the screen.
- **Ball-handler counter:** PG/1 hesitates to freeze X5, then throws the lob over X5's outstretched arm to the rolling C/5.
- **Screener counter:** C/5 rolls hard immediately — speed of the roll exploits X5's delayed recovery.
- **Key cue:** "Make X5 commit — then lob it or attack behind them."

### vs. Switch Coverage

- **Defence:** X5 switches onto PG/1; X1 switches onto C/5.
- **Ball-handler counter:** PG/1 attacks the mismatch (X5 on PG/1) — drives to the paint (approx. x:120, y:255) or isolates from the wing.
- **Screener counter:** C/5 posts up X1 on the low block (approx. x:87, y:210 right block; approx. x:87, y:300 left block) — hunt the mismatch inside.
- **Key cue:** "Switch given — find the mismatch immediately."

### vs. ICE / Blue Coverage

- **Defence:** X1 forces PG/1 baseline (toward the sideline) before the screen is set; X5 stays low protecting the middle.
- **Ball-handler counter:** PG/1 rejects the screen and attacks middle instead (opposite direction of the forced baseline drive), or uses the screen on the non-ICE side.
- **Screener counter:** C/5 slips early to the short corner or the elbow on the iced side (approx. x:175, y:175), receiving a pass before X5 can recover.
- **Key cue:** "If they Ice us, slip early or reject and go middle."

### vs. Blitz / Trap Coverage

- **Defence:** Both X1 and X5 aggressively trap PG/1 at the screen.
- **Ball-handler counter:** PG/1 uses the third dribble as a pivot (pick up the ball before the trap closes), locates the open roll man or corner shooter, and delivers immediately.
- **Screener counter:** C/5 rolls hard to the basket; the trap creates a direct passing lane since X5 has abandoned the roll. Target catch at approx. x:80, y:255.
- **Supporting players:** Off-ball players on the weak side must be ready — the blitz creates a 4v3 if the pass escapes. Corner shooter (approx. x:87, y:73 or x:87, y:438) is the primary outlet.
- **Key cue:** "Two on one — one of us is always open. Make the quick pass."
