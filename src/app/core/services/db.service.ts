import Dexie, { Table } from 'dexie';
import { Injectable } from '@angular/core';
import {
  Player, PlayerNote, Play, PlaySummary,
  TrainingSession, SeasonPlan, GameNote,
} from '../../shared/models/models';

class CoachDiaryDb extends Dexie {
  players!: Table<Player, number>;
  playerNotes!: Table<PlayerNote, number>;
  plays!: Table<Play, number>;
  trainingSessions!: Table<TrainingSession, number>;
  seasonPlans!: Table<SeasonPlan, number>;
  gameNotes!: Table<GameNote, number>;

  constructor() {
    super('CoachDiaryDB');
    this.version(1).stores({
      players: '++id, number, position',
      playerNotes: '++id, player_id, date, category',
      plays: '++id, category, updated_at',
      trainingSessions: '++id, date',
      seasonPlans: '++id, start_date',
      gameNotes: '++id, date',
    });
  }
}

@Injectable({ providedIn: 'root' })
export class DbService {
  private db = new CoachDiaryDb();

  // ── Players ──────────────────────────────────────────────────
  listPlayers(): Promise<Player[]> {
    return this.db.players.orderBy('number').toArray();
  }

  getPlayer(id: number): Promise<Player | undefined> {
    return this.db.players.get(id);
  }

  async savePlayer(player: Player): Promise<number> {
    const now = new Date().toISOString();
    if (player.id) {
      await this.db.players.update(player.id, { ...player, updated_at: now });
      return player.id;
    }
    return this.db.players.add({ ...player, created_at: now, updated_at: now });
  }

  deletePlayer(id: number): Promise<void> {
    return this.db.players.delete(id);
  }

  // ── Player notes ─────────────────────────────────────────────
  listPlayerNotes(playerId: number): Promise<PlayerNote[]> {
    return this.db.playerNotes.where('player_id').equals(playerId).reverse().sortBy('date');
  }

  async savePlayerNote(note: PlayerNote): Promise<number> {
    const now = new Date().toISOString();
    if (note.id) {
      await this.db.playerNotes.update(note.id, note);
      return note.id;
    }
    return this.db.playerNotes.add({ ...note, created_at: now });
  }

  deletePlayerNote(id: number): Promise<void> {
    return this.db.playerNotes.delete(id);
  }

  // ── Plays ────────────────────────────────────────────────────
  async listPlays(): Promise<PlaySummary[]> {
    const plays = await this.db.plays.orderBy('updated_at').reverse().toArray();
    return plays.map(({ canvas_state: _cs, ...rest }) => rest as PlaySummary);
  }

  getPlay(id: number): Promise<Play | undefined> {
    return this.db.plays.get(id);
  }

  async savePlay(play: Play): Promise<number> {
    const now = new Date().toISOString();
    if (play.id) {
      await this.db.plays.update(play.id, { ...play, updated_at: now });
      return play.id;
    }
    return this.db.plays.add({ ...play, created_at: now, updated_at: now });
  }

  deletePlay(id: number): Promise<void> {
    return this.db.plays.delete(id);
  }

  // ── Training sessions ─────────────────────────────────────────
  listTrainingSessions(): Promise<TrainingSession[]> {
    return this.db.trainingSessions.orderBy('date').reverse().toArray();
  }

  getTrainingSession(id: number): Promise<TrainingSession | undefined> {
    return this.db.trainingSessions.get(id);
  }

  async saveTrainingSession(session: TrainingSession): Promise<number> {
    const now = new Date().toISOString();
    if (session.id) {
      await this.db.trainingSessions.update(session.id, { ...session, updated_at: now });
      return session.id;
    }
    return this.db.trainingSessions.add({ ...session, created_at: now, updated_at: now });
  }

  deleteTrainingSession(id: number): Promise<void> {
    return this.db.trainingSessions.delete(id);
  }

  // ── Season plans ──────────────────────────────────────────────
  listSeasonPlans(): Promise<SeasonPlan[]> {
    return this.db.seasonPlans.orderBy('start_date').reverse().toArray();
  }

  getSeasonPlan(id: number): Promise<SeasonPlan | undefined> {
    return this.db.seasonPlans.get(id);
  }

  async saveSeasonPlan(plan: SeasonPlan): Promise<number> {
    const now = new Date().toISOString();
    if (plan.id) {
      await this.db.seasonPlans.update(plan.id, { ...plan, updated_at: now });
      return plan.id;
    }
    return this.db.seasonPlans.add({ ...plan, created_at: now, updated_at: now });
  }

  deleteSeasonPlan(id: number): Promise<void> {
    return this.db.seasonPlans.delete(id);
  }

  // ── Game notes ────────────────────────────────────────────────
  listGameNotes(): Promise<GameNote[]> {
    return this.db.gameNotes.orderBy('date').reverse().toArray();
  }

  async saveGameNote(note: GameNote): Promise<number> {
    const now = new Date().toISOString();
    if (note.id) {
      await this.db.gameNotes.update(note.id, note);
      return note.id;
    }
    return this.db.gameNotes.add({ ...note, created_at: now });
  }

  deleteGameNote(id: number): Promise<void> {
    return this.db.gameNotes.delete(id);
  }
}
