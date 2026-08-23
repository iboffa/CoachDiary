# CoachDiary — Roadmap

## Done
| Feature | Merged |
|---------|--------|
| Team-centric model (routes under /teams/:teamId, DB v2) | 2026-05-xx |
| Training Sessions — drill editor, SVG preview, reordering, duration comparison | 2026-06-08 |
| Team Journal — dated entries persisted in IndexedDB | 2026-06-08 |
| Play/Drill Category Folders — DB v6, inline creation, grouped list views | 2026-06-09 |
| Season Planning — goals checklist with deadlines, DB v7, team-scoped | 2026-06-09 |
| Games Page — DB v8 games store, GamesService CRUD, list/detail views, routing, sidebar link, 48 unit tests | 2026-06-09 |
| Calendar — month/week views, event chips (games, training, goals, journal, custom, recurring), inline add-event form, recurring weekly schedule editor, Game.startTime, TimePickerComponent, DB v9-v10, 80 unit tests | 2026-06-12 |
| Tasks — team-level task list (/teams/:teamId/tasks), player-scoped tasks on player detail, calendar chip integration for due-date tasks, TasksService, DB v11, unit tests | 2026-06-12 |
| Supabase migration — Postgres schema + RLS (phase 1), Supabase Auth/login/route guard (phase 2), DbService rewritten on Supabase client, Dexie fully removed | 2026-08-xx |

## Backlog (sorted by score)

| # | Feature | Priority | Feasibility | Score | Notes |
|---|---------|----------|-------------|-------|-------|
| 0 | Play sharing — export & read-only link | 5 | 3 | 15 | **Validated demand: most-requested feature per coach interviews (2026-08); today done via WhatsApp/external messaging.** Three parts: (a) export play/drill as PNG/PDF from the Fabric.js canvas with app branding — viral acquisition channel; (b) public read-only link (Supabase token URL), no account needed for viewers; (c) animated video export in **MP4/H.264** — WebM export already exists (`play-editor-export.utils.ts`, captureStream + MediaRecorder) but WebM won't play on iOS/WhatsApp; try `MediaRecorder` mimeType `video/mp4` first (recent Chromium), fallback ffmpeg (native in Electron, wasm on web). Delivers ~80% of the sharing value at a fraction of the multi-user cost; ship before #1. |
| 1 | Multi-user Collaboration & Sharing | 5 | 2 | 10 | Staff/player invites, per-team roles (admin/head coach, assistant, player), per-element RLS visibility beyond team-level. Player role: read-only access to shared playbook/drills — prerequisite for playbook sharing with players. Demand validated by coach interviews (see #0); #0 is the quick-win subset, this is the full account-based version needed for B2B. Supabase Auth + Dexie replacement already done (see Done table); Mobile is now unblocked. |
| 2 | MCP server (AI step 1) | 3 | 3 | 9 | Standalone Node.js MCP server, containerised with Docker, deployed to Railway or Fly.io; Angular client communicates via HTTP/SSE. Foundation for all AI features — must be built first. Works in both Electron and future web/mobile clients. |
| 3 | Play-gen eval harness | 3 | 3 | 9 | ~30 test requests run against rag-server, scored with existing `_validate_geometry` + Haiku critique. Prerequisite for all play-gen quality work — without it, tuning is blind. Build first among the play-gen items. |
| 4 | Gold play library (few-shot RAG) | 3 | 3 | 9 | 20-30 hand-authored plays saved as editor JSON (P&R, horns, flex, BLOB box…); retrieve 2-3 most similar as few-shot examples in the generation prompt. Models imitate exact-format examples far better than tactical prose. Biggest quality win for lowest effort. |
| 5 | Chatbot panel (AI step 2) | 4 | 2 | 8 | Validates MCP architecture, immediately useful to coaches. Requires MCP server. v1 exists (`ai-coach-modal` + rag-server chat_handler). |
| 6 | Zone→coordinate play compiler | 4 | 2 | 8 | Split tactics from geometry: LLM outputs a symbolic plan over canonical zone names; deterministic Python compiler resolves coordinates, curves, phase chaining, spacing. Eliminates the geometry-error class entirely and lifts the 3-waypoint limit. Biggest architectural fix for play-gen quality. |
| 7 | Play generation (AI step 3) | 3 | 2 | 6 | Generate plays from player strengths/weaknesses + opponent tendencies. v1 implemented in rag-server (`play_generator.py`) but quality weak — improved by #3, #4, #6, #8. |
| 8 | Targeted repair loop | 2 | 3 | 6 | Replace full-regeneration retry (currently 2 attempts, best-effort fallback) with targeted fixes: ask the model to correct only the failing paths/phases; raise attempt count. |
| 9 | Per-play Q&A thread | 3 | 2 | 6 | Question/answer thread on each play, visible to the whole team (players ask, coach answers once, everyone sees). No competitor has this. Requires #1 (player identities + RLS). Answered Q&As feed the AI-coach RAG as team knowledge. Comments table + RLS + thread UI on play detail. |
| 10 | Play simulation (AI step 4) | 2 | 1 | 2 | Simulate play vs. opponent defense/offense. Hardest AI feature; requires Play generation. |

## Monetization (freemium SaaS)

| Tier | Price | Includes |
|------|-------|----------|
| Free | 0 € | Up to 3 teams, playbook & drill editor, journal, basic calendar. Players join free (read-only shared playbook). |
| Pro | ~8-15 €/mese per coach | Unlimited teams, full calendar, season planning, tasks, playbook export/print. |
| AI add-on | ~20-30 €/mese | Chatbot, play generation, play simulation (backlog #2-5). API costs make these naturally premium. |
| Club (B2B) | 300-1000 €/anno | Multi-coach license, roles & collaboration (backlog #1), admin dashboard. Best margins — target clubs, not individual amateur coaches. |

Notes:
- Player accounts are always free — they drive adoption and lock in the coach.
- Billing: Stripe + Supabase (migration prerequisite already done).
- Mobile before AI: coaches live courtside; retention (and willingness to pay) depends on it.
- Roles/RLS work in backlog #1 is the unlock for both playbook sharing with players and the B2B tier.

## Future / Icebox
- **i18n** — French, Spanish, German, Italian, Serbian, Greek, Lithuanian, Russian, Turkish, Chinese
- **Mobile** — Supabase migration dependency is satisfied; in progress on `feat/supabase-capacitor-mobile`
- **Editor themes** — realistic, high-visibility, whiteboard, dark

## Architecture notes
- DB versioned via Dexie; bump version in `src/app/db/` for every schema change; currently at v11
- Standalone Angular components, SCSS
- Fabric.js for the play/drill canvas editor
- Unit tests: Vitest; e2e: Playwright
- Electron main ↔ Angular renderer via IPC (`contextBridge`)
- **Backend:** Supabase (Postgres + Supabase Auth), migrated from Dexie on `feat/supabase-capacitor-mobile` (not yet merged to main). Team-level RLS via `is_team_member()`. Per-element visibility, staff/player invites, and admin roles are still backlog #4.
