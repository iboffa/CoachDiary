import { Injectable } from '@angular/core';
import { DbService } from './db.service';
import { Opponent, OpponentNote, OpponentPlayer } from '../../shared/models/models';

@Injectable({ providedIn: 'root' })
export class OpponentService {
  constructor(private db: DbService) {}

  list(teamId: string): Promise<Opponent[]> { return this.db.listOpponents(teamId); }
  get(id: string): Promise<Opponent | undefined> { return this.db.getOpponent(id); }
  save(opponent: Opponent): Promise<string> { return this.db.saveOpponent(opponent); }
  delete(id: string): Promise<void> { return this.db.deleteOpponent(id); }

  listNotes(opponentId: string): Promise<OpponentNote[]> { return this.db.listOpponentNotes(opponentId); }
  saveNote(note: OpponentNote): Promise<string> { return this.db.saveOpponentNote(note); }
  deleteNote(id: string): Promise<void> { return this.db.deleteOpponentNote(id); }

  listPlayers(opponentId: string): Promise<OpponentPlayer[]> { return this.db.listOpponentPlayers(opponentId); }
  savePlayer(player: OpponentPlayer): Promise<string> { return this.db.saveOpponentPlayer(player); }
  deletePlayer(id: string): Promise<void> { return this.db.deleteOpponentPlayer(id); }
}
