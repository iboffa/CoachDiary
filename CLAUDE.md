# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

CoachDiary is a basketball coaching app: coaches manage teams and rosters, draw and animate set plays on a court canvas (`features/playbook`), plan and log training-session drills, scout opponents, track games, and plan a season. An AI Coach chat feature (`rag-server/` + `AiCoachModalComponent`) answers basketball questions and can generate plays from a team's roster.

## Commands

- `npm start` / `ng serve` — dev server at http://localhost:4200
- `npm test` — unit tests (Vitest via the `@angular/build:unit-test` builder, configured in `angular.json`'s `test` target and `vitest-base.config.ts`)
  - `npx ng test --watch=false` — single non-watch run (plain `ng test` watches when stdin is a TTY)
  - `npx ng test --watch=false --include='src/app/core/services/db.service.spec.ts'` — run one spec file (`--include` can repeat)
  - `npx ng test --watch=false --reporters=verbose` — per-test output instead of the default summary
- `npm run build` — full production build (`build:renderer` + `build:electron`); `npm run build:renderer` alone builds just the Angular app to `dist/renderer`
- `npm run electron:dev` / `npm run electron:prod` — run the Electron desktop shell
- `npx playwright test` — e2e specs in `e2e/`; there's no `webServer` in `playwright.config.ts`, so start `ng serve` yourself first
- `npm run cap:sync` / `npm run cap:open:android` — sync the web build into the Capacitor Android project / open it in Android Studio

## Architecture

**One Angular 22 standalone app, three packages.** The same `src/` builds to a web app (`ng serve`/`build:renderer`), an Electron desktop app (`electron/main.ts` + `build:electron`, loads the built renderer via `loadFile`), and an Android app (Capacitor, wraps `dist/renderer/browser`). Platform-specific behavior branches on `Capacitor.isNativePlatform()` or `ElectronService.isElectron` (e.g. `AuthService`'s OAuth redirect handling), not on separate builds.

**Backend is Supabase (Postgres + Auth), not a custom API.** There is no app server — the renderer talks to Supabase directly. Schema and RLS policies live in `supabase/migrations/*.sql`. `src/app/shared/models/models.ts` mirrors that schema exactly: snake_case fields, string (UUID) ids. This replaced an earlier Dexie/IndexedDB local-storage design (camelCase fields, numeric ids) in commit `4178aba` — if you see camelCase/numeric-id assumptions anywhere, they're pre-migration leftovers, not the current contract.

**Data access funnels through two layers:**
- `SupabaseService` (`core/services/supabase.service.ts`) just holds the `createClient()` instance.
- `AuthService` (`core/services/auth.service.ts`) wraps `supabase.client.auth` — `session$`/`session`/`currentUserId()`, sign-in/up/out, and the OAuth deep-link callback flow (`coachdiary://auth-callback`, handled differently in Electron vs. Capacitor vs. web). **Its constructor eagerly calls `getSession()` and subscribes to `onAuthStateChange` the moment it's instantiated** — including transitively, e.g. any component that injects `DbService`.
- `DbService` (`core/services/db.service.ts`) is the single point of contact with Postgres: one list/get/save/delete method group per table, all thin wrappers over `supabase.client.from(...)`. Feature services (`GameService`, `TasksService`, `TeamService`, `TrainingSessionService`, etc.) sit on top of it with feature-specific logic; most components go through a feature service, not `DbService` directly — the one direct exception is `AiCoachModalComponent`, which needs a live roster.

**Routing is team-centric.** Nearly everything lives under `teams/:teamId/...` (`src/app/app.routes.ts`); `authGuard` (`core/guards/auth.guard.ts`) protects every route except `/login`. The playbook and opponent-playbook routes reuse the same `PlayListComponent`/`PlayEditorComponent`.

**The AI Coach feature calls out to a separate service.** `rag-server/` (Python/FastAPI) is a standalone deployable that isn't started by any npm script — `core/services/rag.service.ts` talks to it over HTTP at `environment.ragServerUrl` (defaults to `localhost:8000`). Run it separately (see `rag-server/docker-compose.yml`).

## Testing conventions

- **Any spec that instantiates `DbService` or `AuthService` (directly, or transitively by rendering a component that injects one) must override it with a mock**, or `AuthService`'s constructor will build a real Supabase `GoTrueClient` and make live calls against the production project — on the order of a minute per test, and unwanted traffic against prod. See `core/services/db.service.spec.ts` (a fluent fake query-builder mocking `SupabaseService`) and `core/services/auth.service.spec.ts` (a fake auth client) for the pattern; `features/playbook/play-editor/play-editor.component.spec.ts` shows the same fix applied where a child component (`AiCoachModalComponent`) was the real culprit.
- Specs use `provideRouter([])` — there are no real routes, so any `router.navigate()` a test actually triggers needs `vi.spyOn(router, 'navigate').mockResolvedValue(true)` (or it surfaces as an unhandled `NG04002` rejection rather than a failed assertion).
- `play-editor.component.spec.ts` constructs a real `fabric.js` canvas per test, which is CPU-heavy under jsdom; it raises its own timeout via `vi.setConfig({ testTimeout: 60000 })` rather than the 30s default in `vitest-base.config.ts`.
