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

## Backlog (sorted by score)

| # | Feature | Priority | Feasibility | Score | Notes |
|---|---------|----------|-------------|-------|-------|
| 1 | MCP server (AI step 1) | 3 | 3 | 9 | Standalone Node.js MCP server, containerised with Docker, deployed to Railway or Fly.io; Angular client communicates via HTTP/SSE. Foundation for all AI features — must be built first. Works in both Electron and future web/mobile clients. |
| 2 | Chatbot panel (AI step 2) | 4 | 2 | 8 | Validates MCP architecture, immediately useful to coaches. Requires MCP server. |
| 3 | Play generation (AI step 3) | 3 | 2 | 6 | Generate plays from player strengths/weaknesses + opponent tendencies. Requires Chatbot panel. |
| 4 | Multi-user Collaboration & Sharing | 5 | 1 | 5 | Supabase Auth (Google, Apple, Facebook, email), staff/player invites, per-element RLS visibility, admin roles; replaces local Dexie and unblocks Mobile. |
| 5 | Play simulation (AI step 4) | 2 | 1 | 2 | Simulate play vs. opponent defense/offense. Hardest AI feature; requires Play generation. |

## Future / Icebox
- **i18n** — French, Spanish, German, Italian, Serbian, Greek, Lithuanian, Russian, Turkish, Chinese
- **Mobile** — depends on the Supabase migration shared with Multi-user Collaboration (backlog #2)
- **Editor themes** — realistic, high-visibility, whiteboard, dark

## Architecture notes
- DB versioned via Dexie; bump version in `src/app/db/` for every schema change; currently at v11
- Standalone Angular components, SCSS
- Fabric.js for the play/drill canvas editor
- Unit tests: Vitest; e2e: Playwright
- Electron main ↔ Angular renderer via IPC (`contextBridge`)
- **Planned backend:** Supabase (Postgres + Supabase Auth). Auth handles Google/Apple/Facebook/email social login. Row-level security (RLS) enforces per-element visibility. Will replace local Dexie when Multi-user Collaboration is built; Mobile depends on the same migration.
