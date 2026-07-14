import { Injectable } from '@angular/core';
import { DbService } from './db.service';
import { Game } from '../../shared/models/models';

@Injectable({ providedIn: 'root' })
export class GameService {
  constructor(private db: DbService) {}

  getGamesByTeam(teamId: string): Promise<Game[]> { return this.db.listGames(teamId); }
  getGame(id: string): Promise<Game | undefined> { return this.db.getGame(id); }
  addGame(game: Omit<Game, 'id'>): Promise<string> { return this.db.addGame(game); }
  updateGame(id: string, changes: Partial<Omit<Game, 'id'>>): Promise<void> { return this.db.updateGame(id, changes); }
  deleteGame(id: string): Promise<void> { return this.db.deleteGame(id); }
}
