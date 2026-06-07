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

  // Catch-all fallback
  { path: '**', redirectTo: 'teams' },
];
