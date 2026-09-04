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
| Supabase migration — Postgres schema + RLS (phase 1), Supabase Auth/login/route guard (phase 2), DbService rewritten on Supabase client, Dexie fully removed | 2026-08-24 |
| Capacitor Android mobile — native Android wrapper, account settings page, OAuth deep-link (coachdiary://auth-callback), Capacitor App/Browser plugin; auth/RLS hardening (session-desync fix, handle_new_user trigger search_path bug, teams RLS self-reference bug) | 2026-08-24 |
| RLS hardening — closed a cross-tenant bypass where a nullable `team_id` let rows leak across teams | 2026-09-04 |
| Play editor mobile touch targets — larger tap targets on tokens/path handles below the mobile breakpoint, context menu clamped to court bounds; phase-preview/playback and save/duplicate logic extracted into `PlayAnimationController`/`PlaySaveController` | 2026-09-04 |

## Backlog (sorted by score)

| # | Feature | Priority | Feasibility | Score | Notes |
|---|---------|----------|-------------|-------|-------|
| 1 | Play sharing — export & read-only link | 5 | 3 | 15 | **Validated demand: most-requested feature per coach interviews (2026-08); today done via WhatsApp/external messaging.** Three parts: (a) export play/drill as PNG/PDF from the Fabric.js canvas with app branding — viral acquisition channel; (b) public read-only link (Supabase token URL), no account needed for viewers; (c) animated video export in **MP4/H.264** — WebM export already exists (`play-editor-export.utils.ts`, captureStream + MediaRecorder) but WebM won't play on iOS/WhatsApp; try `MediaRecorder` mimeType `video/mp4` first (recent Chromium), fallback ffmpeg (native in Electron, wasm on web). Delivers ~80% of the sharing value at a fraction of the multi-user cost; ship before #2. |
| 2 | Multi-user Collaboration & Sharing | 5 | 3 | 15 | Staff/player invites, per-team roles (admin/head coach, assistant, player), per-element RLS visibility beyond team-level. Player role: read-only access to shared playbook/drills — prerequisite for playbook sharing with players. Demand validated by coach interviews (see #1); #1 is the quick-win subset, this is the full account-based version needed for B2B. Supabase Auth, mobile, and auth/RLS hardening all done — feasibility is higher now. |
| 3 | MCP server (AI step 1) | 3 | 3 | 9 | Standalone Node.js MCP server, containerised with Docker, deployed to Railway or Fly.io; Angular client communicates via HTTP/SSE. Foundation for all AI features — must be built first. Works in both Electron and future web/mobile clients. |
| 4 | Play-gen eval harness | 3 | 3 | 9 | ~30 test requests run against rag-server, scored with existing `_validate_geometry` + Haiku critique. Prerequisite for all play-gen quality work — without it, tuning is blind. Build first among the play-gen items. |
| 5 | Gold play library (few-shot RAG) | 3 | 3 | 9 | 20-30 hand-authored plays saved as editor JSON (P&R, horns, flex, BLOB box…); retrieve 2-3 most similar as few-shot examples in the generation prompt. Models imitate exact-format examples far better than tactical prose. Biggest quality win for lowest effort. |
| 6 | Chatbot panel (AI step 2) | 4 | 2 | 8 | Validates MCP architecture, immediately useful to coaches. Requires MCP server. v1 exists (`ai-coach-modal` + rag-server chat_handler). |
| 7 | Zone→coordinate play compiler | 4 | 2 | 8 | Split tactics from geometry: LLM outputs a symbolic plan over canonical zone names; deterministic Python compiler resolves coordinates, curves, phase chaining, spacing. Eliminates the geometry-error class entirely and lifts the 3-waypoint limit. Biggest architectural fix for play-gen quality. |
| 8 | Play generation (AI step 3) | 3 | 2 | 6 | Generate plays from player strengths/weaknesses + opponent tendencies. v1 implemented in rag-server (`play_generator.py`) but quality weak — improved by #4, #5, #7, #9. |
| 9 | Targeted repair loop | 2 | 3 | 6 | Replace full-regeneration retry (currently 2 attempts, best-effort fallback) with targeted fixes: ask the model to correct only the failing paths/phases; raise attempt count. |
| 10 | Per-play Q&A thread | 3 | 2 | 6 | Question/answer thread on each play, visible to the whole team (players ask, coach answers once, everyone sees). No competitor has this. Requires #2 (player identities + RLS). Answered Q&As feed the AI-coach RAG as team knowledge. Comments table + RLS + thread UI on play detail. |
| 11 | Play simulation (AI step 4) | 2 | 1 | 2 | Simulate play vs. opponent defense/offense. Hardest AI feature; requires Play generation. |

## Monetization (freemium SaaS)

| Tier | Price | Includes |
|------|-------|----------|
| Free | 0 € | Up to 3 teams, playbook & drill editor, journal, basic calendar. Players join free (read-only shared playbook). |
| Pro | ~8-15 €/mese per coach | Unlimited teams, full calendar, season planning, tasks, playbook export/print. |
| AI add-on | ~20-30 €/mese | Chatbot, play generation, play simulation (backlog #3-6). API costs make these naturally premium. |
| Club (B2B) | 300-1000 €/anno | Multi-coach license, roles & collaboration (backlog #2), admin dashboard. Best margins — target clubs, not individual amateur coaches. |

Notes:
- Player accounts are always free — they drive adoption and lock in the coach.
- Billing: Stripe + Supabase (migration prerequisite already done).
- Mobile app is shipped; courtside access is no longer a gap.
- Roles/RLS work in backlog #2 is the unlock for both playbook sharing with players and the B2B tier.

## Future / Icebox
- **i18n** — French, Spanish, German, Italian, Serbian, Greek, Lithuanian, Russian, Turkish, Chinese
- **Editor themes** — realistic, high-visibility, whiteboard, dark

## AI Feature Track
Steps that must happen in order:
1. Local MCP server (Electron main process, IPC to Angular renderer)
2. Chatbot panel
3. Play generation
4. Play simulation

## Architecture notes
- **DB:** Supabase (Postgres + Supabase Auth); Dexie/IndexedDB fully removed. Schema in Supabase migrations; RLS via `is_team_member()`. Team-level RLS hardened (session-desync, handle_new_user trigger, teams self-reference bug all fixed).
- Standalone Angular components, SCSS
- Fabric.js for the play/drill canvas editor
- **Mobile:** Capacitor Android wrapper merged; OAuth deep-link via `coachdiary://auth-callback` custom scheme; Capacitor App + Browser plugins; play editor tap targets sized up below the mobile breakpoint.
- Unit tests: Vitest (`@angular/build:unit-test` runner); e2e: Playwright. As of 2026-09-04 the full suite (15 files, 310 tests) is green — several fabric.js-heavy play-editor specs run close to the default 30s timeout in this environment and are bumped to 60s.
- Electron main ↔ Angular renderer via IPC (`contextBridge`)
- Per-element RLS visibility, staff/player invites, and admin roles are still backlog #2.
