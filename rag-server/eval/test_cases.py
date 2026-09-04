"""
~30 play-generation requests spanning the play families the knowledge base
covers. Used by eval/run_eval.py to score /generate-play output quality.
"""

from dataclasses import dataclass
from typing import Literal


@dataclass
class TestCase:
    id: str
    category: str
    description: str
    court_mode: Literal["half", "full"] = "half"


TEST_CASES: list[TestCase] = [
    # BLOB (4)
    TestCase("blob-01", "BLOB", "Baseline out-of-bounds play for a quick layup — stack formation near the rim, screen the primary defender away, inbounder hits the cutter for an easy bucket."),
    TestCase("blob-02", "BLOB", "BLOB set to get our best shooter a corner three off a staggered double screen."),
    TestCase("blob-03", "BLOB", "Baseline inbound against man-to-man where the point guard is trapped — need a safe outlet plus a backdoor option if they overplay the first pass."),
    TestCase("blob-04", "BLOB", "BLOB isolation play that clears one side of the floor for our post player to work one-on-one on the block."),

    # SLOB (3)
    TestCase("slob-01", "SLOB", "Sideline out-of-bounds play from the wing to get a quick catch-and-shoot three at the top of the key."),
    TestCase("slob-02", "SLOB", "Sideline inbound with a screen-the-screener action to spring our second option open on the wing."),
    TestCase("slob-03", "SLOB", "SLOB near half-court after a made basket — get the ball up the floor fast for a transition look before the defense sets."),

    # ATO (3)
    TestCase("ato-01", "ATO", "After-timeout play drawn up for one clean look — a stagger screen for our shooting guard coming off two screens to the top of the key for three."),
    TestCase("ato-02", "ATO", "ATO special: horns alignment into a quick ball screen for the point guard with a shooter spotting up in the corner."),
    TestCase("ato-03", "ATO", "After a timeout with 8 seconds left, need a play to get a good look for our best free-throw shooter to either score or draw a foul."),

    # Horns (2)
    TestCase("horns-01", "Horns", "Horns set — point guard at the top, two bigs at the elbows, wings in the corners — into a pick-and-roll with the near-side big."),
    TestCase("horns-02", "Horns", "Horns alignment that flows into a dribble handoff between the point guard and one of the elbow bigs, with the other big diving to the rim."),

    # Floppy (2)
    TestCase("floppy-01", "Floppy", "Floppy action off a made basket — shooter can curl off a down screen on one side or fade off a screen on the other, reading the defense."),
    TestCase("floppy-02", "Floppy", "Floppy set for our best three-point shooter, using a double screen on the block that they can curl or fade off of."),

    # Elevator (2)
    TestCase("elevator-01", "Elevator", "Elevator doors set to spring our shooter open at the top of the key for a clean catch-and-shoot three."),
    TestCase("elevator-02", "Elevator", "Elevator screen action out of a BLOB to get a jump shot for the player who's struggling to get separation off the dribble."),

    # DHO (2)
    TestCase("dho-01", "DHO", "Dribble handoff between the point guard and the wing, using the momentum to attack downhill off the handoff."),
    TestCase("dho-02", "DHO", "Chain of two dribble handoffs across the top of the key to probe the defense before attacking the rim."),

    # Motion-5 (2)
    TestCase("motion5-01", "Motion-5", "Five-out motion offense with constant cutting and screening — read-and-react basketball for a team with good spacing but no dominant scorer."),
    TestCase("motion5-02", "Motion-5", "Motion offense out of a five-out set that emphasizes back cuts whenever the defense overplays the passing lanes."),

    # Pick-and-roll (2)
    TestCase("pnr-01", "Pick-and-roll", "Side ball screen for the point guard with the screener rolling hard to the rim — simple two-man game to start the possession."),
    TestCase("pnr-02", "Pick-and-roll", "Top-of-the-key pick-and-roll where the screener pops out to the three-point line instead of rolling, since he's a good shooter."),

    # Zone offense (2)
    TestCase("zone-01", "Zone offense", "Offense against a 2-3 zone defense — attack the gaps and get the ball into the short corner for an easy look."),
    TestCase("zone-02", "Zone offense", "Offense to beat a 1-3-1 zone — overload one side of the floor and skip the ball to the weak side for an open three."),

    # Roster variation (2)
    TestCase("roster-01", "Roster variation", "Play built around our dominant post player — everyone else spaces the floor and the offense runs through the block."),
    TestCase("roster-02", "Roster variation", "Perimeter-heavy set for a team with no real post presence — everyone spread out beyond the arc, attacking off the dribble."),

    # Level segmentation (2)
    TestCase("youth-01", "Level segmentation", "Simple, easy-to-teach play for a youth team (U12) — basic spacing and one pass to get an open shot, nothing too complicated."),
    TestCase("comp-01", "Level segmentation", "Advanced set for a competitive high-level team — multiple reads, counters built in if the first option is taken away."),

    # Edge cases (2)
    TestCase("edge-01", "Edge case", "Quick hitter."),
    TestCase("edge-02", "Edge case", "Full-court press-break play to get the ball from baseline to baseline safely against a trapping defense.", court_mode="full"),
]
