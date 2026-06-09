# CoachDiary — Roadmap

## Done
| Feature | Merged |
|---------|--------|
| Team-centric model (routes under /teams/:teamId, DB v2) | 2026-05-xx |
| Training Sessions — drill editor, SVG preview, reordering, duration comparison | 2026-06-08 |
| Team Journal — dated entries persisted in IndexedDB | 2026-06-08 |
| Play/Drill Category Folders — DB v6, inline creation, grouped list views | 2026-06-09 |
| Season Planning — goals checklist with deadlines, DB v7, team-scoped | 2026-06-09 |

## Backlog (sorted by score)

| # | Feature | Priority | Feasibility | Score | Notes |
|---|---------|----------|-------------|-------|-------|
| 1 | Games Page | 5 | 5 | 25 | Per-team game list with opponent, result, notes; last major data domain missing from MVP |
| 2 | Calendar | 4 | 3 | 12 | Unified view of trainings, games, tasks, meetings; will also absorb the season schedule/events scope |
| 3 | Tasks | 3 | 3 | 9 | Free-form cross-entity tasks with deadlines; reduced priority now that season goals checklist covers much of this need |

## AI Feature Track (sequential — do not reorder)
1. **Local MCP server** — runs inside Electron main process; Angular renderer talks via IPC. Foundation for all AI features.
2. **Chatbot panel** — validates architecture, immediately useful to coaches.
3. **Play generation** — from player strengths/weaknesses + opponent tendencies.
4. **Play simulation** — play vs. opponent defense/offense (hardest, last).

## Future / Icebox
- **i18n** — French, Spanish, German, Italian, Serbian, Greek, Lithuanian, Russian, Turkish, Chinese
- **Mobile** — requires backend rethink (Supabase/PocketBase to replace local Dexie)
- **Editor themes** — realistic, high-visibility, whiteboard, dark

## Architecture notes
- DB versioned via Dexie; bump version in `src/app/db/` for every schema change
- Standalone Angular components, SCSS
- Fabric.js for the play/drill canvas editor
- Unit tests: Vitest; e2e: Playwright
- Electron main ↔ Angular renderer via IPC (`contextBridge`)
