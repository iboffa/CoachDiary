import { Routes } from '@angular/router';
import { TeamsComponent } from './features/teams/teams.component';

export const routes: Routes = [
  { path: '', redirectTo: 'teams', pathMatch: 'full' },

  // Teams main page
  { path: 'teams', component: TeamsComponent },

  // Team — playbook
  {
    path: 'teams/:teamId/playbook',
    loadComponent: () =>
      import('./features/playbook/play-list/play-list.component').then(m => m.PlayListComponent),
  },
  {
    path: 'teams/:teamId/playbook/:id',
    loadComponent: () =>
      import('./features/playbook/play-editor/play-editor.component').then(m => m.PlayEditorComponent),
  },

  // Team — roster
  {
    path: 'teams/:teamId/roster',
    loadComponent: () =>
      import('./features/players/players.component').then(m => m.PlayersComponent),
  },

  // Team — opponents
  {
    path: 'teams/:teamId/opponents',
    loadComponent: () =>
      import('./features/opponents/opponent-list/opponent-list.component').then(m => m.OpponentListComponent),
  },
  {
    path: 'teams/:teamId/opponents/:oppId',
    loadComponent: () =>
      import('./features/opponents/opponent-detail/opponent-detail.component').then(m => m.OpponentDetailComponent),
  },

  // Opponent — playbook
  {
    path: 'teams/:teamId/opponents/:oppId/playbook',
    loadComponent: () =>
      import('./features/playbook/play-list/play-list.component').then(m => m.PlayListComponent),
  },
  {
    path: 'teams/:teamId/opponents/:oppId/playbook/:id',
    loadComponent: () =>
      import('./features/playbook/play-editor/play-editor.component').then(m => m.PlayEditorComponent),
  },

  // Team — notes
  {
    path: 'teams/:teamId/notes',
    loadComponent: () =>
      import('./features/teams/team-notes/team-notes.component').then(m => m.TeamNotesComponent),
  },

  // Team — training sessions
  {
    path: 'teams/:teamId/training',
    loadComponent: () =>
      import('./features/training/training.component').then(m => m.TrainingComponent),
  },
  {
    path: 'teams/:teamId/training/:sessionId/drill/:drillId',
    loadComponent: () =>
      import('./features/training/exercise-editor/exercise-editor.component').then(m => m.ExerciseEditorComponent),
  },

  // Team - season planning
  {
    path: 'teams/:teamId/season',
    loadComponent: () =>
      import('./features/season/season.component').then(m => m.SeasonComponent),
  },

  // Team — games
  {
    path: 'teams/:teamId/games',
    loadComponent: () =>
      import('./features/games/games-list/games-list.component').then(m => m.GamesListComponent),
  },
  {
    path: 'teams/:teamId/games/:gameId',
    loadComponent: () =>
      import('./features/games/game-detail/game-detail.component').then(m => m.GameDetailComponent),
  },

  // Team — calendar
  {
    path: 'teams/:teamId/calendar',
    loadComponent: () =>
      import('./features/calendar/calendar.component').then(m => m.CalendarComponent),
  },

  // Team — tasks
  {
    path: 'teams/:teamId/tasks',
    loadComponent: () =>
      import('./features/tasks/tasks.component').then(m => m.TasksComponent),
  },

  // Catch-all fallback
  { path: '**', redirectTo: 'teams' },
];
