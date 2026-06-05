import { Routes } from '@angular/router';
import { PlayListComponent } from './play-list/play-list.component';
import { PlayEditorComponent } from './play-editor/play-editor.component';

export const PLAYBOOK_ROUTES: Routes = [
  { path: '', component: PlayListComponent },
  { path: 'new', component: PlayEditorComponent },
  { path: ':id', component: PlayEditorComponent },
];
