import Dexie, { Table } from 'dexie';
import { Injectable } from '@angular/core';
import {
  Player, PlayerNote, Play, PlaySummary,
  TrainingSession, SeasonPlan, GameNote,
  Team, TeamNote, Opponent, OpponentPlayer, OpponentNote, SavedDrill,
  PlayCategory, DrillCategory,
} from '../../shared/models/models';

class CoachDiaryDb extends Dexie {
  players!: Table<Player, number>;
  playerNotes!: Table<PlayerNote, number>;
  plays!: Table<Play, number>;
  trainingSessions!: Table<TrainingSession, number>;
  savedDrills!: Table<SavedDrill, number>;
  seasonPlans!: Table<SeasonPlan, number>;
  gameNotes!: Table<GameNote, number>;
  teams!: Table<Team, number>;
  teamNotes!: Table<TeamNote, number>;
  opponents!: Table<Opponent, number>;
  opponentNotes!: Table<OpponentNote, number>;
  opponentPlayers!: Table<OpponentPlayer, number>;
  playCategories!: Table<PlayCategory, number>;
  drillCategories!: Table<DrillCategory, number>;

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
    this.version(2).stores({
      players: '++id, team_id, number, position',
      plays: '++id, team_id, opponent_id, category, updated_at',
      teams: '++id',
      opponents: '++id, team_id',
      opponentNotes: '++id, opponent_id, date',
      opponentPlayers: '++id, opponent_id',
    });
    this.version(3).stores({
      trainingSessions: '++id, team_id, date',
    });
    this.version(4).stores({
      savedDrills: '++id, name',
    });
    this.version(5).stores({
      teamNotes: '++id, team_id, date',
    });
    this.version(6).stores({
      plays: '++id, team_id, opponent_id, category_id, updated_at',
      savedDrills: '++id, name, category_id',
      playCategories: '++id, team_id',
      drillCategories: '++id',
    }).upgrade(tx => tx.table('plays').toCollection().modify(play => {
      delete (play as Record<string, unknown>)['category'];
    }));
    this.version(7).stores({
      seasonPlans: '++id, team_id, start_date',
    });
  }
}

@Injectable({ providedIn: 'root' })
export class DbService {
  private db = new CoachDiaryDb();

  // ── Teams ─────────────────────────────────────────────────────
  listTeams(): Promise<Team[]> {
    return this.db.teams.toArray().then(t => t.sort((a, b) => a.name.localeCompare(b.name)));
  }

  getTeam(id: number): Promise<Team | undefined> {
    return this.db.teams.get(id);
  }

  async saveTeam(team: Team): Promise<number> {
    const now = new Date().toISOString();
    if (team.id) {
      await this.db.teams.update(team.id, { ...team, updated_at: now });
      return team.id;
    }
    return this.db.teams.add({ ...team, created_at: now, updated_at: now });
  }

  deleteTeam(id: number): Promise<void> {
    return this.db.teams.delete(id);
  }

  // ── Team Notes ────────────────────────────────────────────────
  listTeamNotes(teamId: number): Promise<TeamNote[]> {
    return this.db.teamNotes.where('team_id').equals(teamId).reverse().sortBy('date');
  }

  async saveTeamNote(note: TeamNote): Promise<number> {
    const now = new Date().toISOString();
    if (note.id) {
      await this.db.teamNotes.update(note.id, note);
      return note.id;
    }
    return this.db.teamNotes.add({ ...note, created_at: now });
  }

  deleteTeamNote(id: number): Promise<void> {
    return this.db.teamNotes.delete(id);
  }

  // ── Opponents ─────────────────────────────────────────────────
  listOpponents(teamId: number): Promise<Opponent[]> {
    return this.db.opponents.where('team_id').equals(teamId).sortBy('name');
  }

  getOpponent(id: number): Promise<Opponent | undefined> {
    return this.db.opponents.get(id);
  }

  async saveOpponent(opponent: Opponent): Promise<number> {
    const now = new Date().toISOString();
    if (opponent.id) {
      await this.db.opponents.update(opponent.id, { ...opponent, updated_at: now });
      return opponent.id;
    }
    return this.db.opponents.add({ ...opponent, created_at: now, updated_at: now });
  }

  deleteOpponent(id: number): Promise<void> {
    return this.db.opponents.delete(id);
  }

  // ── Opponent Notes ────────────────────────────────────────────
  listOpponentNotes(opponentId: number): Promise<OpponentNote[]> {
    return this.db.opponentNotes.where('opponent_id').equals(opponentId).reverse().sortBy('date');
  }

  async saveOpponentNote(note: OpponentNote): Promise<number> {
    const now = new Date().toISOString();
    if (note.id) {
      await this.db.opponentNotes.update(note.id, note);
      return note.id;
    }
    return this.db.opponentNotes.add({ ...note, created_at: now });
  }

  deleteOpponentNote(id: number): Promise<void> {
    return this.db.opponentNotes.delete(id);
  }

  // ── Opponent Players ──────────────────────────────────────────
  listOpponentPlayers(opponentId: number): Promise<OpponentPlayer[]> {
    return this.db.opponentPlayers.where('opponent_id').equals(opponentId).sortBy('number');
  }

  async saveOpponentPlayer(player: OpponentPlayer): Promise<number> {
    if (player.id) {
      await this.db.opponentPlayers.update(player.id, player);
      return player.id;
    }
    return this.db.opponentPlayers.add(player);
  }

  deleteOpponentPlayer(id: number): Promise<void> {
    return this.db.opponentPlayers.delete(id);
  }

  // ── Players ──────────────────────────────────────────────────
  listPlayers(teamId?: number): Promise<Player[]> {
    if (teamId !== undefined) {
      return this.db.players.where('team_id').equals(teamId).sortBy('number');
    }
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
  async listPlays(filter?: { teamId?: number; opponentId?: number }): Promise<PlaySummary[]> {
    let plays: Play[];
    if (filter?.teamId !== undefined) {
      plays = await this.db.plays.where('team_id').equals(filter.teamId).reverse().sortBy('updated_at');
    } else if (filter?.opponentId !== undefined) {
      plays = await this.db.plays.where('opponent_id').equals(filter.opponentId).reverse().sortBy('updated_at');
    } else {
      plays = await this.db.plays.orderBy('updated_at').reverse().toArray();
    }
    return plays
      .filter(p => !p.is_template)
      .map(({ canvas_state: _cs, ...rest }) => rest as PlaySummary);
  }

  async listTemplates(filter?: { teamId?: number; opponentId?: number }): Promise<PlaySummary[]> {
    let plays: Play[];
    if (filter?.teamId !== undefined) {
      plays = await this.db.plays.where('team_id').equals(filter.teamId).reverse().sortBy('updated_at');
    } else if (filter?.opponentId !== undefined) {
      plays = await this.db.plays.where('opponent_id').equals(filter.opponentId).reverse().sortBy('updated_at');
    } else {
      plays = await this.db.plays.orderBy('updated_at').reverse().toArray();
    }
    return plays
      .filter(p => p.is_template)
      .map(({ canvas_state: _cs, ...rest }) => rest as PlaySummary);
  }

  getPlay(id: number): Promise<Play | undefined> {
    return this.db.plays.get(id);
  }

  async savePlay(play: Play): Promise<number> {
    const now = new Date().toISOString();
    if (play.id) {
      const playId = play.id;
      await this.db.plays.where('id').equals(playId).modify(stored => {
        Object.assign(stored, { ...play, updated_at: now });
        if (play.category_id === undefined) {
          delete (stored as unknown as Record<string, unknown>)['category_id'];
        }
      });
      return playId;
    }
    return this.db.plays.add({ ...play, created_at: now, updated_at: now });
  }

  deletePlay(id: number): Promise<void> {
    return this.db.plays.delete(id);
  }

  // ── Training sessions ─────────────────────────────────────────
  async listTrainingSessions(teamId?: number): Promise<TrainingSession[]> {
    let all: TrainingSession[];
    if (teamId !== undefined) {
      all = await this.db.trainingSessions.where('team_id').equals(teamId).reverse().sortBy('date');
    } else {
      all = await this.db.trainingSessions.orderBy('date').reverse().toArray();
    }
    return all.filter(s => !s.is_template);
  }

  async listTrainingSessionTemplates(teamId?: number): Promise<TrainingSession[]> {
    let all: TrainingSession[];
    if (teamId !== undefined) {
      all = await this.db.trainingSessions.where('team_id').equals(teamId).reverse().sortBy('date');
    } else {
      all = await this.db.trainingSessions.orderBy('date').reverse().toArray();
    }
    return all.filter(s => !!s.is_template);
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

  // ── Saved drills ─────────────────────────────────────────────
  listSavedDrills(): Promise<SavedDrill[]> {
    return this.db.savedDrills.orderBy('name').toArray();
  }

  async saveSavedDrill(drill: SavedDrill): Promise<number> {
    const now = new Date().toISOString();
    if (drill.id) {
      await this.db.savedDrills.update(drill.id, { ...drill });
      return drill.id;
    }
    return this.db.savedDrills.add({ ...drill, created_at: now });
  }

  deleteSavedDrill(id: number): Promise<void> {
    return this.db.savedDrills.delete(id);
  }

  // ── Season plans ──────────────────────────────────────────────
  listSeasonPlans(teamId?: number): Promise<SeasonPlan[]> {
    if (teamId !== undefined) {
      return this.db.seasonPlans.where('team_id').equals(teamId).reverse().sortBy('start_date');
    }
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

  // ── Play categories ───────────────────────────────────────────
  listPlayCategories(teamId: number): Promise<PlayCategory[]> {
    return this.db.playCategories.where('team_id').equals(teamId).sortBy('name');
  }

  async savePlayCategory(cat: PlayCategory): Promise<number> {
    if (cat.id) {
      await this.db.playCategories.update(cat.id, cat);
      return cat.id;
    }
    return this.db.playCategories.add(cat);
  }

  async deletePlayCategory(id: number): Promise<void> {
    await this.db.plays.where('category_id').equals(id).modify({ category_id: undefined });
    await this.db.playCategories.delete(id);
  }

  // ── Drill categories ──────────────────────────────────────────
  listDrillCategories(): Promise<DrillCategory[]> {
    return this.db.drillCategories.toArray().then(cats => cats.sort((a, b) => a.name.localeCompare(b.name)));
  }

  async saveDrillCategory(cat: DrillCategory): Promise<number> {
    if (cat.id) {
      await this.db.drillCategories.update(cat.id, cat);
      return cat.id;
    }
    return this.db.drillCategories.add(cat);
  }

  async deleteDrillCategory(id: number): Promise<void> {
    await this.db.savedDrills.where('category_id').equals(id).modify({ category_id: undefined });
    await this.db.drillCategories.delete(id);
  }
}
