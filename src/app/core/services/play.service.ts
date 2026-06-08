import { Injectable } from '@angular/core';
import { DbService } from './db.service';
import { Play, PlayCategory, PlaySummary } from '../../shared/models/models';

@Injectable({ providedIn: 'root' })
export class PlayService {
  constructor(private db: DbService) {}

  list(filter?: { teamId?: number; opponentId?: number }): Promise<PlaySummary[]> {
    return this.db.listPlays(filter);
  }
  listTemplates(filter?: { teamId?: number; opponentId?: number }): Promise<PlaySummary[]> {
    return this.db.listTemplates(filter);
  }
  get(id: number): Promise<Play | undefined> { return this.db.getPlay(id); }
  save(play: Play): Promise<number> { return this.db.savePlay(play); }
  delete(id: number): Promise<void> { return this.db.deletePlay(id); }

  listCategories(teamId: number): Promise<PlayCategory[]> { return this.db.listPlayCategories(teamId); }
  saveCategory(cat: PlayCategory): Promise<number> { return this.db.savePlayCategory(cat); }
  deleteCategory(id: number): Promise<void> { return this.db.deletePlayCategory(id); }
}
