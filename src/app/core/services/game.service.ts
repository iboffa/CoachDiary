import { Injectable } from '@angular/core';
import { DbService } from './db.service';
import { Game } from '../../shared/models/models';

@Injectable({ providedIn: 'root' })
export class GameService {
  constructor(private db: DbService) {}

  getGamesByTeam(teamId: number): Promise<Game[]> {
    return this.db.listGames(teamId);
  }

  getGame(id: number): Promise<Game | undefined> {
    return this.db.getGame(id);
  }

  addGame(game: Omit<Game, 'id'>): Promise<number> {
    return this.db.addGame(game);
  }

  updateGame(id: number, changes: Partial<Omit<Game, 'id'>>): Promise<void> {
    return this.db.updateGame(id, changes);
  }

  deleteGame(id: number): Promise<void> {
    return this.db.deleteGame(id);
  }
}
