import { Injectable } from '@angular/core';
import { DbService } from './db.service';
import { Opponent, OpponentNote, OpponentPlayer } from '../../shared/models/models';

@Injectable({ providedIn: 'root' })
export class OpponentService {
  constructor(private db: DbService) {}

  list(teamId: number): Promise<Opponent[]> { return this.db.listOpponents(teamId); }
  get(id: number): Promise<Opponent | undefined> { return this.db.getOpponent(id); }
  save(opponent: Opponent): Promise<number> { return this.db.saveOpponent(opponent); }
  delete(id: number): Promise<void> { return this.db.deleteOpponent(id); }

  listNotes(opponentId: number): Promise<OpponentNote[]> { return this.db.listOpponentNotes(opponentId); }
  saveNote(note: OpponentNote): Promise<number> { return this.db.saveOpponentNote(note); }
  deleteNote(id: number): Promise<void> { return this.db.deleteOpponentNote(id); }

  listPlayers(opponentId: number): Promise<OpponentPlayer[]> { return this.db.listOpponentPlayers(opponentId); }
  savePlayer(player: OpponentPlayer): Promise<number> { return this.db.saveOpponentPlayer(player); }
  deletePlayer(id: number): Promise<void> { return this.db.deleteOpponentPlayer(id); }
}
