import { Injectable } from '@angular/core';
import {
  Player, PlayerNote, Play, PlaySummary,
  TrainingSession, SeasonPlan, GameNote,
  Team, TeamNote, Opponent, OpponentPlayer, OpponentNote, SavedDrill,
  PlayCategory, DrillCategory, Game, CalendarCustomEvent, RecurringSchedule, Task,
} from '../../shared/models/models';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class DbService {
  private get db() { return this.supabase.client; }

  constructor(private supabase: SupabaseService, private auth: AuthService) {}

  // ── Teams ─────────────────────────────────────────────────────

  async listTeams(): Promise<Team[]> {
    const { data, error } = await this.db.from('teams').select('*').order('name');
    if (error) throw error;
    return data as Team[];
  }

  async getTeam(id: string): Promise<Team | undefined> {
    const { data, error } = await this.db.from('teams').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data as Team ?? undefined;
  }

  async saveTeam(team: Team): Promise<string> {
    const now = new Date().toISOString();
    if (team.id) {
      const { error } = await this.db.from('teams').update({ ...team, updated_at: now }).eq('id', team.id);
      if (error) throw error;
      return team.id;
    }
    const { data, error } = await this.db.from('teams')
      .insert({ ...team, owner_id: this.auth.currentUserId(), created_at: now, updated_at: now })
      .select('id').single();
    if (error) throw error;
    return (data as { id: string }).id;
  }

  async deleteTeam(id: string): Promise<void> {
    const { error } = await this.db.from('teams').delete().eq('id', id);
    if (error) throw error;
  }

  // ── Team Notes ────────────────────────────────────────────────

  async listTeamNotes(teamId: string): Promise<TeamNote[]> {
    const { data, error } = await this.db.from('team_notes')
      .select('*').eq('team_id', teamId).order('date', { ascending: false });
    if (error) throw error;
    return data as TeamNote[];
  }

  async saveTeamNote(note: TeamNote): Promise<string> {
    const now = new Date().toISOString();
    if (note.id) {
      const { error } = await this.db.from('team_notes').update(note).eq('id', note.id);
      if (error) throw error;
      return note.id;
    }
    const { data, error } = await this.db.from('team_notes')
      .insert({ ...note, created_at: now }).select('id').single();
    if (error) throw error;
    return (data as { id: string }).id;
  }

  async deleteTeamNote(id: string): Promise<void> {
    const { error } = await this.db.from('team_notes').delete().eq('id', id);
    if (error) throw error;
  }

  // ── Opponents ─────────────────────────────────────────────────

  async listOpponents(teamId: string): Promise<Opponent[]> {
    const { data, error } = await this.db.from('opponents')
      .select('*').eq('team_id', teamId).order('name');
    if (error) throw error;
    return data as Opponent[];
  }

  async getOpponent(id: string): Promise<Opponent | undefined> {
    const { data, error } = await this.db.from('opponents').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data as Opponent ?? undefined;
  }

  async saveOpponent(opponent: Opponent): Promise<string> {
    const now = new Date().toISOString();
    if (opponent.id) {
      const { error } = await this.db.from('opponents')
        .update({ ...opponent, updated_at: now }).eq('id', opponent.id);
      if (error) throw error;
      return opponent.id;
    }
    const { data, error } = await this.db.from('opponents')
      .insert({ ...opponent, created_at: now, updated_at: now }).select('id').single();
    if (error) throw error;
    return (data as { id: string }).id;
  }

  async deleteOpponent(id: string): Promise<void> {
    const { error } = await this.db.from('opponents').delete().eq('id', id);
    if (error) throw error;
  }

  // ── Opponent Notes ────────────────────────────────────────────

  async listOpponentNotes(opponentId: string): Promise<OpponentNote[]> {
    const { data, error } = await this.db.from('opponent_notes')
      .select('*').eq('opponent_id', opponentId).order('date', { ascending: false });
    if (error) throw error;
    return data as OpponentNote[];
  }

  async saveOpponentNote(note: OpponentNote): Promise<string> {
    const now = new Date().toISOString();
    if (note.id) {
      const { error } = await this.db.from('opponent_notes').update(note).eq('id', note.id);
      if (error) throw error;
      return note.id;
    }
    const { data, error } = await this.db.from('opponent_notes')
      .insert({ ...note, created_at: now }).select('id').single();
    if (error) throw error;
    return (data as { id: string }).id;
  }

  async deleteOpponentNote(id: string): Promise<void> {
    const { error } = await this.db.from('opponent_notes').delete().eq('id', id);
    if (error) throw error;
  }

  // ── Opponent Players ──────────────────────────────────────────

  async listOpponentPlayers(opponentId: string): Promise<OpponentPlayer[]> {
    const { data, error } = await this.db.from('opponent_players')
      .select('*').eq('opponent_id', opponentId).order('number');
    if (error) throw error;
    return data as OpponentPlayer[];
  }

  async saveOpponentPlayer(player: OpponentPlayer): Promise<string> {
    if (player.id) {
      const { error } = await this.db.from('opponent_players').update(player).eq('id', player.id);
      if (error) throw error;
      return player.id;
    }
    const { data, error } = await this.db.from('opponent_players')
      .insert(player).select('id').single();
    if (error) throw error;
    return (data as { id: string }).id;
  }

  async deleteOpponentPlayer(id: string): Promise<void> {
    const { error } = await this.db.from('opponent_players').delete().eq('id', id);
    if (error) throw error;
  }

  // ── Players ──────────────────────────────────────────────────

  async listPlayers(teamId?: string): Promise<Player[]> {
    let query = this.db.from('players').select('*').order('number');
    if (teamId !== undefined) query = query.eq('team_id', teamId);
    const { data, error } = await query;
    if (error) throw error;
    return data as Player[];
  }

  async getPlayer(id: string): Promise<Player | undefined> {
    const { data, error } = await this.db.from('players').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data as Player ?? undefined;
  }

  async savePlayer(player: Player): Promise<string> {
    const now = new Date().toISOString();
    if (player.id) {
      const { error } = await this.db.from('players')
        .update({ ...player, updated_at: now }).eq('id', player.id);
      if (error) throw error;
      return player.id;
    }
    const { data, error } = await this.db.from('players')
      .insert({ ...player, created_at: now, updated_at: now }).select('id').single();
    if (error) throw error;
    return (data as { id: string }).id;
  }

  async deletePlayer(id: string): Promise<void> {
    const { error } = await this.db.from('players').delete().eq('id', id);
    if (error) throw error;
  }

  // ── Player Notes ─────────────────────────────────────────────

  async listPlayerNotes(playerId: string): Promise<PlayerNote[]> {
    const { data, error } = await this.db.from('player_notes')
      .select('*').eq('player_id', playerId).order('date', { ascending: false });
    if (error) throw error;
    return data as PlayerNote[];
  }

  async savePlayerNote(note: PlayerNote): Promise<string> {
    const now = new Date().toISOString();
    if (note.id) {
      const { error } = await this.db.from('player_notes').update(note).eq('id', note.id);
      if (error) throw error;
      return note.id;
    }
    const { data, error } = await this.db.from('player_notes')
      .insert({ ...note, created_at: now }).select('id').single();
    if (error) throw error;
    return (data as { id: string }).id;
  }

  async deletePlayerNote(id: string): Promise<void> {
    const { error } = await this.db.from('player_notes').delete().eq('id', id);
    if (error) throw error;
  }

  // ── Plays ────────────────────────────────────────────────────

  async listPlays(filter?: { teamId?: string; opponentId?: string }): Promise<PlaySummary[]> {
    const cols = 'id,team_id,opponent_id,category_id,name,description,thumbnail,is_template,created_at,updated_at';
    let query = this.db.from('plays').select(cols).eq('is_template', false).order('updated_at', { ascending: false });
    if (filter?.teamId) query = query.eq('team_id', filter.teamId);
    if (filter?.opponentId) query = query.eq('opponent_id', filter.opponentId);
    const { data, error } = await query;
    if (error) throw error;
    return data as PlaySummary[];
  }

  async listTemplates(filter?: { teamId?: string; opponentId?: string }): Promise<PlaySummary[]> {
    const cols = 'id,team_id,opponent_id,category_id,name,description,thumbnail,is_template,created_at,updated_at';
    let query = this.db.from('plays').select(cols).eq('is_template', true).order('updated_at', { ascending: false });
    if (filter?.teamId) query = query.eq('team_id', filter.teamId);
    if (filter?.opponentId) query = query.eq('opponent_id', filter.opponentId);
    const { data, error } = await query;
    if (error) throw error;
    return data as PlaySummary[];
  }

  async getPlay(id: string): Promise<Play | undefined> {
    const { data, error } = await this.db.from('plays').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data as Play ?? undefined;
  }

  async savePlay(play: Play): Promise<string> {
    const now = new Date().toISOString();
    if (play.id) {
      const { error } = await this.db.from('plays')
        .update({ ...play, updated_at: now }).eq('id', play.id);
      if (error) throw error;
      return play.id;
    }
    const { data, error } = await this.db.from('plays')
      .insert({ ...play, created_at: now, updated_at: now }).select('id').single();
    if (error) throw error;
    return (data as { id: string }).id;
  }

  async deletePlay(id: string): Promise<void> {
    const { error } = await this.db.from('plays').delete().eq('id', id);
    if (error) throw error;
  }

  // ── Training Sessions ─────────────────────────────────────────

  async listTrainingSessions(teamId?: string): Promise<TrainingSession[]> {
    let query = this.db.from('training_sessions').select('*')
      .eq('is_template', false).order('date', { ascending: false });
    if (teamId !== undefined) query = query.eq('team_id', teamId);
    const { data, error } = await query;
    if (error) throw error;
    return data as TrainingSession[];
  }

  async listTrainingSessionTemplates(teamId?: string): Promise<TrainingSession[]> {
    let query = this.db.from('training_sessions').select('*')
      .eq('is_template', true).order('date', { ascending: false });
    if (teamId !== undefined) query = query.eq('team_id', teamId);
    const { data, error } = await query;
    if (error) throw error;
    return data as TrainingSession[];
  }

  async getTrainingSession(id: string): Promise<TrainingSession | undefined> {
    const { data, error } = await this.db.from('training_sessions').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data as TrainingSession ?? undefined;
  }

  async saveTrainingSession(session: TrainingSession): Promise<string> {
    const now = new Date().toISOString();
    if (session.id) {
      const { error } = await this.db.from('training_sessions')
        .update({ ...session, updated_at: now }).eq('id', session.id);
      if (error) throw error;
      return session.id;
    }
    const { data, error } = await this.db.from('training_sessions')
      .insert({ ...session, created_at: now, updated_at: now }).select('id').single();
    if (error) throw error;
    return (data as { id: string }).id;
  }

  async deleteTrainingSession(id: string): Promise<void> {
    const { error } = await this.db.from('training_sessions').delete().eq('id', id);
    if (error) throw error;
  }

  // ── Saved Drills ─────────────────────────────────────────────

  async listSavedDrills(): Promise<SavedDrill[]> {
    const { data, error } = await this.db.from('saved_drills').select('*').order('name');
    if (error) throw error;
    return data as SavedDrill[];
  }

  async saveSavedDrill(drill: SavedDrill): Promise<string> {
    if (drill.id) {
      const { error } = await this.db.from('saved_drills').update(drill).eq('id', drill.id);
      if (error) throw error;
      return drill.id;
    }
    const { data, error } = await this.db.from('saved_drills')
      .insert({ ...drill, created_by: this.auth.currentUserId(), created_at: new Date().toISOString() })
      .select('id').single();
    if (error) throw error;
    return (data as { id: string }).id;
  }

  async deleteSavedDrill(id: string): Promise<void> {
    const { error } = await this.db.from('saved_drills').delete().eq('id', id);
    if (error) throw error;
  }

  // ── Season Plans ──────────────────────────────────────────────

  async listSeasonPlans(teamId?: string): Promise<SeasonPlan[]> {
    let query = this.db.from('season_plans').select('*').order('start_date', { ascending: false });
    if (teamId !== undefined) query = query.eq('team_id', teamId);
    const { data, error } = await query;
    if (error) throw error;
    return data as SeasonPlan[];
  }

  async getSeasonPlan(id: string): Promise<SeasonPlan | undefined> {
    const { data, error } = await this.db.from('season_plans').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data as SeasonPlan ?? undefined;
  }

  async saveSeasonPlan(plan: SeasonPlan): Promise<string> {
    const now = new Date().toISOString();
    if (plan.id) {
      const { error } = await this.db.from('season_plans')
        .update({ ...plan, updated_at: now }).eq('id', plan.id);
      if (error) throw error;
      return plan.id;
    }
    const { data, error } = await this.db.from('season_plans')
      .insert({ ...plan, created_at: now, updated_at: now }).select('id').single();
    if (error) throw error;
    return (data as { id: string }).id;
  }

  async deleteSeasonPlan(id: string): Promise<void> {
    const { error } = await this.db.from('season_plans').delete().eq('id', id);
    if (error) throw error;
  }

  // ── Game Notes ────────────────────────────────────────────────

  async listGameNotes(): Promise<GameNote[]> {
    const { data, error } = await this.db.from('game_notes').select('*').order('date', { ascending: false });
    if (error) throw error;
    return data as GameNote[];
  }

  async saveGameNote(note: GameNote): Promise<string> {
    const now = new Date().toISOString();
    if (note.id) {
      const { error } = await this.db.from('game_notes').update(note).eq('id', note.id);
      if (error) throw error;
      return note.id;
    }
    const { data, error } = await this.db.from('game_notes')
      .insert({ ...note, created_at: now }).select('id').single();
    if (error) throw error;
    return (data as { id: string }).id;
  }

  async deleteGameNote(id: string): Promise<void> {
    const { error } = await this.db.from('game_notes').delete().eq('id', id);
    if (error) throw error;
  }

  // ── Play Categories ───────────────────────────────────────────

  async listPlayCategories(teamId: string): Promise<PlayCategory[]> {
    const { data, error } = await this.db.from('play_categories')
      .select('*').eq('team_id', teamId).order('name');
    if (error) throw error;
    return data as PlayCategory[];
  }

  async savePlayCategory(cat: PlayCategory): Promise<string> {
    if (cat.id) {
      const { error } = await this.db.from('play_categories').update(cat).eq('id', cat.id);
      if (error) throw error;
      return cat.id;
    }
    const { data, error } = await this.db.from('play_categories').insert(cat).select('id').single();
    if (error) throw error;
    return (data as { id: string }).id;
  }

  async deletePlayCategory(id: string): Promise<void> {
    // Nullify references before deleting (Postgres FK is ON DELETE SET NULL, so this is handled by the DB)
    const { error } = await this.db.from('play_categories').delete().eq('id', id);
    if (error) throw error;
  }

  // ── Games ─────────────────────────────────────────────────────

  async listGames(teamId: string): Promise<Game[]> {
    const { data, error } = await this.db.from('games')
      .select('*').eq('team_id', teamId).order('date', { ascending: false });
    if (error) throw error;
    return data as Game[];
  }

  async getGame(id: string): Promise<Game | undefined> {
    const { data, error } = await this.db.from('games').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data as Game ?? undefined;
  }

  async addGame(game: Omit<Game, 'id'>): Promise<string> {
    const { data, error } = await this.db.from('games').insert(game).select('id').single();
    if (error) throw error;
    return (data as { id: string }).id;
  }

  async updateGame(id: string, changes: Partial<Omit<Game, 'id'>>): Promise<void> {
    const { error } = await this.db.from('games').update(changes).eq('id', id);
    if (error) throw error;
  }

  async deleteGame(id: string): Promise<void> {
    const { error } = await this.db.from('games').delete().eq('id', id);
    if (error) throw error;
  }

  // ── Calendar Events ───────────────────────────────────────────

  async listCalendarEvents(teamId: string): Promise<CalendarCustomEvent[]> {
    const { data, error } = await this.db.from('calendar_events')
      .select('*').eq('team_id', teamId).order('date');
    if (error) throw error;
    return data as CalendarCustomEvent[];
  }

  async addCalendarEvent(event: Omit<CalendarCustomEvent, 'id'>): Promise<string> {
    const { data, error } = await this.db.from('calendar_events').insert(event).select('id').single();
    if (error) throw error;
    return (data as { id: string }).id;
  }

  async updateCalendarEvent(id: string, changes: Partial<CalendarCustomEvent>): Promise<void> {
    const { error } = await this.db.from('calendar_events').update(changes).eq('id', id);
    if (error) throw error;
  }

  async deleteCalendarEvent(id: string): Promise<void> {
    const { error } = await this.db.from('calendar_events').delete().eq('id', id);
    if (error) throw error;
  }

  // ── Recurring Schedules ───────────────────────────────────────

  async listRecurringSchedules(teamId: string): Promise<RecurringSchedule[]> {
    const { data, error } = await this.db.from('recurring_schedules')
      .select('*').eq('team_id', teamId);
    if (error) throw error;
    return data as RecurringSchedule[];
  }

  async addRecurringSchedule(s: Omit<RecurringSchedule, 'id'>): Promise<string> {
    const { data, error } = await this.db.from('recurring_schedules').insert(s).select('id').single();
    if (error) throw error;
    return (data as { id: string }).id;
  }

  async updateRecurringSchedule(id: string, changes: Partial<RecurringSchedule>): Promise<void> {
    const { error } = await this.db.from('recurring_schedules').update(changes).eq('id', id);
    if (error) throw error;
  }

  async deleteRecurringSchedule(id: string): Promise<void> {
    const { error } = await this.db.from('recurring_schedules').delete().eq('id', id);
    if (error) throw error;
  }

  // ── Drill Categories ──────────────────────────────────────────

  async listDrillCategories(): Promise<DrillCategory[]> {
    const { data, error } = await this.db.from('drill_categories').select('*').order('name');
    if (error) throw error;
    return data as DrillCategory[];
  }

  async saveDrillCategory(cat: DrillCategory): Promise<string> {
    if (cat.id) {
      const { error } = await this.db.from('drill_categories').update(cat).eq('id', cat.id);
      if (error) throw error;
      return cat.id;
    }
    const { data, error } = await this.db.from('drill_categories')
      .insert({ ...cat, created_by: this.auth.currentUserId() }).select('id').single();
    if (error) throw error;
    return (data as { id: string }).id;
  }

  async deleteDrillCategory(id: string): Promise<void> {
    const { error } = await this.db.from('drill_categories').delete().eq('id', id);
    if (error) throw error;
  }

  // ── Tasks ─────────────────────────────────────────────────────

  async listTasksByTeam(teamId: string): Promise<Task[]> {
    const { data, error } = await this.db.from('tasks').select('*').eq('team_id', teamId);
    if (error) throw error;
    return data as Task[];
  }

  async listTasksByPlayer(teamId: string, playerId: string): Promise<Task[]> {
    const { data, error } = await this.db.from('tasks').select('*')
      .eq('team_id', teamId).eq('player_id', playerId);
    if (error) throw error;
    return data as Task[];
  }

  async addTask(task: Omit<Task, 'id'>): Promise<string> {
    const { data, error } = await this.db.from('tasks').insert(task).select('id').single();
    if (error) throw error;
    return (data as { id: string }).id;
  }

  async updateTask(id: string, changes: Partial<Omit<Task, 'id'>>): Promise<void> {
    const { error } = await this.db.from('tasks').update(changes).eq('id', id);
    if (error) throw error;
  }

  async deleteTask(id: string): Promise<void> {
    const { error } = await this.db.from('tasks').delete().eq('id', id);
    if (error) throw error;
  }

  async toggleTaskDone(id: string): Promise<void> {
    const { data } = await this.db.from('tasks').select('done').eq('id', id).single();
    if (data) {
      const { error } = await this.db.from('tasks')
        .update({ done: !(data as { done: boolean }).done }).eq('id', id);
      if (error) throw error;
    }
  }
}
