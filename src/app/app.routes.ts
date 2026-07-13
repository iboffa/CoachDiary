import { Routes } from '@angular/router';
import { TeamsComponent } from './features/teams/teams.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'teams', pathMatch: 'full' },

  // Auth
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login.component').then(m => m.LoginComponent),
  },

  // Teams main page
  { path: 'teams', component: TeamsComponent, canActivate: [authGuard] },

  // Team — playbook
  {
    path: 'teams/:teamId/playbook',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/playbook/play-list/play-list.component').then(m => m.PlayListComponent),
  },
  {
    path: 'teams/:teamId/playbook/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/playbook/play-editor/play-editor.component').then(m => m.PlayEditorComponent),
  },

  // Team — roster
  {
    path: 'teams/:teamId/roster',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/players/players.component').then(m => m.PlayersComponent),
  },

  // Team — opponents
  {
    path: 'teams/:teamId/opponents',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/opponents/opponent-list/opponent-list.component').then(m => m.OpponentListComponent),
  },
  {
    path: 'teams/:teamId/opponents/:oppId',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/opponents/opponent-detail/opponent-detail.component').then(m => m.OpponentDetailComponent),
  },

  // Opponent — playbook
  {
    path: 'teams/:teamId/opponents/:oppId/playbook',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/playbook/play-list/play-list.component').then(m => m.PlayListComponent),
  },
  {
    path: 'teams/:teamId/opponents/:oppId/playbook/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/playbook/play-editor/play-editor.component').then(m => m.PlayEditorComponent),
  },

  // Team — notes
  {
    path: 'teams/:teamId/notes',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/teams/team-notes/team-notes.component').then(m => m.TeamNotesComponent),
  },

  // Team — training sessions
  {
    path: 'teams/:teamId/training',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/training/training.component').then(m => m.TrainingComponent),
  },
  {
    path: 'teams/:teamId/training/:sessionId/drill/:drillId',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/training/exercise-editor/exercise-editor.component').then(m => m.ExerciseEditorComponent),
  },

  // Team — season planning
  {
    path: 'teams/:teamId/season',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/season/season.component').then(m => m.SeasonComponent),
  },

  // Team — games
  {
    path: 'teams/:teamId/games',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/games/games-list/games-list.component').then(m => m.GamesListComponent),
  },
  {
    path: 'teams/:teamId/games/:gameId',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/games/game-detail/game-detail.component').then(m => m.GameDetailComponent),
  },

  // Team — calendar
  {
    path: 'teams/:teamId/calendar',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/calendar/calendar.component').then(m => m.CalendarComponent),
  },

  // Team — tasks
  {
    path: 'teams/:teamId/tasks',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/tasks/tasks.component').then(m => m.TasksComponent),
  },

  // Catch-all fallback
  { path: '**', redirectTo: 'teams' },
];
