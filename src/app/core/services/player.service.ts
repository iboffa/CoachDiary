import { Injectable } from '@angular/core';
import { DbService } from './db.service';
import { Player, PlayerNote } from '../../shared/models/models';

@Injectable({ providedIn: 'root' })
export class PlayerService {
  constructor(private db: DbService) {}

  list(teamId?: string): Promise<Player[]> { return this.db.listPlayers(teamId); }
  get(id: string): Promise<Player | undefined> { return this.db.getPlayer(id); }
  save(player: Player): Promise<string> { return this.db.savePlayer(player); }
  delete(id: string): Promise<void> { return this.db.deletePlayer(id); }

  listNotes(playerId: string): Promise<PlayerNote[]> { return this.db.listPlayerNotes(playerId); }
  saveNote(note: PlayerNote): Promise<string> { return this.db.savePlayerNote(note); }
  deleteNote(id: string): Promise<void> { return this.db.deletePlayerNote(id); }
}
