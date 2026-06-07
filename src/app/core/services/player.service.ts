import { Injectable } from '@angular/core';
import { DbService } from './db.service';
import { Player, PlayerNote } from '../../shared/models/models';

@Injectable({ providedIn: 'root' })
export class PlayerService {
  constructor(private db: DbService) {}

  list(teamId?: number): Promise<Player[]> { return this.db.listPlayers(teamId); }
  get(id: number): Promise<Player | undefined> { return this.db.getPlayer(id); }
  save(player: Player): Promise<number> { return this.db.savePlayer(player); }
  delete(id: number): Promise<void> { return this.db.deletePlayer(id); }

  listNotes(playerId: number): Promise<PlayerNote[]> { return this.db.listPlayerNotes(playerId); }
  saveNote(note: PlayerNote): Promise<number> { return this.db.savePlayerNote(note); }
  deleteNote(id: number): Promise<void> { return this.db.deletePlayerNote(id); }
}
