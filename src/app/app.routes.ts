import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'playbook', pathMatch: 'full' },
  {
    path: 'playbook',
    loadChildren: () =>
      import('./features/playbook/playbook.routes').then(m => m.PLAYBOOK_ROUTES),
  },
  {
    path: 'players',
    loadChildren: () =>
      import('./features/players/players.routes').then(m => m.PLAYERS_ROUTES),
  },
  {
    path: 'training',
    loadChildren: () =>
      import('./features/training/training.routes').then(m => m.TRAINING_ROUTES),
  },
  {
    path: 'season',
    loadChildren: () =>
      import('./features/season/season.routes').then(m => m.SEASON_ROUTES),
  },
];
