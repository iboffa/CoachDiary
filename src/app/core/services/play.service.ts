import { Injectable } from '@angular/core';
import { DbService } from './db.service';
import { Play, PlayCategory, PlaySummary } from '../../shared/models/models';

@Injectable({ providedIn: 'root' })
export class PlayService {
  constructor(private db: DbService) {}

  list(filter?: { teamId?: string; opponentId?: string }): Promise<PlaySummary[]> { return this.db.listPlays(filter); }
  listTemplates(filter?: { teamId?: string; opponentId?: string }): Promise<PlaySummary[]> { return this.db.listTemplates(filter); }
  get(id: string): Promise<Play | undefined> { return this.db.getPlay(id); }
  save(play: Play): Promise<string> { return this.db.savePlay(play); }
  delete(id: string): Promise<void> { return this.db.deletePlay(id); }

  listCategories(teamId: string): Promise<PlayCategory[]> { return this.db.listPlayCategories(teamId); }
  saveCategory(cat: PlayCategory): Promise<string> { return this.db.savePlayCategory(cat); }
  deleteCategory(id: string): Promise<void> { return this.db.deletePlayCategory(id); }
}
