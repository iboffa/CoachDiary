import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { CalendarService } from './calendar.service';
import { GameService } from '../../core/services/game.service';
import { TrainingSessionService } from '../../core/services/training-session.service';
import { SeasonPlanService } from '../../core/services/season-plan.service';
import { TeamService } from '../../core/services/team.service';
import { CalendarCustomEventService } from './calendar-custom-event.service';
import { RecurringScheduleService } from './recurring-schedule.service';
import { Game, TrainingSession, SeasonPlan, TeamNote } from '../../shared/models/models';
import { CalendarEvent } from './calendar-event.model';

const TEAM_ID = 1;

function makeGame(overrides: Partial<Game> = {}): Game {
  return {
    id: 10,
    teamId: TEAM_ID,
    date: '2026-06-15',
    opponent: 'Bulls U18',
    homeAway: 'home',
    scoreUs: null,
    scoreThem: null,
    notes: '',
    ...overrides,
  };
}

function makeTraining(overrides: Partial<TrainingSession> = {}): TrainingSession {
  return {
    id: 20,
    team_id: TEAM_ID,
    name: 'Morning drill',
    date: '2026-06-10',
    drills: '[]',
    ...overrides,
  };
}

function makePlan(goals: string, overrides: Partial<SeasonPlan> = {}): SeasonPlan {
  return {
    id: 30,
    team_id: TEAM_ID,
    name: '2025-26 Season',
    goals,
    ...overrides,
  };
}

function makeNote(overrides: Partial<TeamNote> = {}): TeamNote {
  return {
    id: 40,
    team_id: TEAM_ID,
    date: '2026-06-20',
    content: 'Good practice today',
    ...overrides,
  };
}

describe('CalendarService', () => {
  let service: CalendarService;
  let gameService: any;
  let trainingService: any;
  let seasonPlanService: any;
  let teamService: any;
  let customEventService: any;
  let recurringScheduleService: any;

  beforeEach(() => {
    gameService = { getGamesByTeam: vi.fn().mockResolvedValue([]) };
    trainingService = { list: vi.fn().mockResolvedValue([]) };
    seasonPlanService = { list: vi.fn().mockResolvedValue([]) };
    teamService = { listNotes: vi.fn().mockResolvedValue([]) };
    customEventService = { listByTeam: vi.fn().mockResolvedValue([]) };
    recurringScheduleService = {
      list: vi.fn().mockResolvedValue([]),
      expandToEvents: vi.fn().mockReturnValue([]),
    };

    TestBed.configureTestingModule({
      providers: [
        CalendarService,
        { provide: GameService, useValue: gameService },
        { provide: TrainingSessionService, useValue: trainingService },
        { provide: SeasonPlanService, useValue: seasonPlanService },
        { provide: TeamService, useValue: teamService },
        { provide: CalendarCustomEventService, useValue: customEventService },
        { provide: RecurringScheduleService, useValue: recurringScheduleService },
      ],
    });

    service = TestBed.inject(CalendarService);
  });

  // ── game mapping ─────────────────────────────────────────────────

  describe('game mapping', () => {
    it('maps a game to a CalendarEvent with type "game"', async () => {
      gameService.getGamesByTeam.mockResolvedValue([makeGame()]);
      const events = await firstValueFrom(service.getEventsForTeam(TEAM_ID));
      const event = events.find(e => e.type === 'game');
      expect(event).toBeDefined();
      expect(event!.type).toBe('game');
    });

    it('uses the opponent name as the event title', async () => {
      gameService.getGamesByTeam.mockResolvedValue([makeGame({ opponent: 'Bulls U18' })]);
      const events = await firstValueFrom(service.getEventsForTeam(TEAM_ID));
      const event = events.find(e => e.type === 'game')!;
      expect(event.title).toBe('Bulls U18');
    });

    it('parses the game date string into a Date', async () => {
      gameService.getGamesByTeam.mockResolvedValue([makeGame({ date: '2026-06-15' })]);
      const events = await firstValueFrom(service.getEventsForTeam(TEAM_ID));
      const event = events.find(e => e.type === 'game')!;
      expect(event.date).toBeInstanceOf(Date);
      expect(event.date.getFullYear()).toBe(2026);
      expect(event.date.getMonth()).toBe(5);
      expect(event.date.getDate()).toBe(15);
    });

    it('sets a routerLink pointing to the game detail', async () => {
      gameService.getGamesByTeam.mockResolvedValue([makeGame({ id: 10 })]);
      const events = await firstValueFrom(service.getEventsForTeam(TEAM_ID));
      const event = events.find(e => e.type === 'game')!;
      expect(event.routerLink).toEqual(['/teams', String(TEAM_ID), 'games', '10']);
    });
  });

  // ── training mapping ─────────────────────────────────────────────

  describe('training mapping', () => {
    it('maps a training session to a CalendarEvent with type "training"', async () => {
      trainingService.list.mockResolvedValue([makeTraining()]);
      const events = await firstValueFrom(service.getEventsForTeam(TEAM_ID));
      const event = events.find(e => e.type === 'training');
      expect(event).toBeDefined();
      expect(event!.type).toBe('training');
    });

    it('uses the session name as the title', async () => {
      trainingService.list.mockResolvedValue([makeTraining({ name: 'Morning drill' })]);
      const events = await firstValueFrom(service.getEventsForTeam(TEAM_ID));
      const event = events.find(e => e.type === 'training')!;
      expect(event.title).toBe('Morning drill');
    });

    it('skips training sessions without a date', async () => {
      trainingService.list.mockResolvedValue([makeTraining({ date: undefined })]);
      const events = await firstValueFrom(service.getEventsForTeam(TEAM_ID));
      expect(events.filter(e => e.type === 'training')).toHaveLength(0);
    });

    it('sets a routerLink pointing to the training page', async () => {
      trainingService.list.mockResolvedValue([makeTraining()]);
      const events = await firstValueFrom(service.getEventsForTeam(TEAM_ID));
      const event = events.find(e => e.type === 'training')!;
      expect(event.routerLink).toEqual(['/teams', String(TEAM_ID), 'training']);
    });
  });

  // ── season-goal mapping ──────────────────────────────────────────

  describe('season-goal mapping', () => {
    it('maps a goal with a deadline to a CalendarEvent with type "season-goal"', async () => {
      const goals = JSON.stringify([
        { id: 'g1', text: 'Win the championship', done: false, deadline: '2026-03-01' },
      ]);
      seasonPlanService.list.mockResolvedValue([makePlan(goals)]);
      const events = await firstValueFrom(service.getEventsForTeam(TEAM_ID));
      const event = events.find(e => e.type === 'season-goal');
      expect(event).toBeDefined();
      expect(event!.type).toBe('season-goal');
    });

    it('uses the goal text as the event title', async () => {
      const goals = JSON.stringify([
        { id: 'g1', text: 'Win the championship', done: false, deadline: '2026-03-01' },
      ]);
      seasonPlanService.list.mockResolvedValue([makePlan(goals)]);
      const events = await firstValueFrom(service.getEventsForTeam(TEAM_ID));
      const event = events.find(e => e.type === 'season-goal')!;
      expect(event.title).toBe('Win the championship');
    });

    it('uses the goal deadline as the event date', async () => {
      const goals = JSON.stringify([
        { id: 'g1', text: 'Win', done: false, deadline: '2026-03-01' },
      ]);
      seasonPlanService.list.mockResolvedValue([makePlan(goals)]);
      const events = await firstValueFrom(service.getEventsForTeam(TEAM_ID));
      const event = events.find(e => e.type === 'season-goal')!;
      expect(event.date).toBeInstanceOf(Date);
      expect(event.date.getFullYear()).toBe(2026);
      expect(event.date.getMonth()).toBe(2);
      expect(event.date.getDate()).toBe(1);
    });

    it('excludes a season goal without a deadline', async () => {
      const goals = JSON.stringify([
        { id: 'g1', text: 'No deadline goal', done: false },
      ]);
      seasonPlanService.list.mockResolvedValue([makePlan(goals)]);
      const events = await firstValueFrom(service.getEventsForTeam(TEAM_ID));
      expect(events.filter(e => e.type === 'season-goal')).toHaveLength(0);
    });

    it('excludes a season goal with an empty-string deadline', async () => {
      const goals = JSON.stringify([
        { id: 'g1', text: 'Empty deadline', done: false, deadline: '' },
      ]);
      seasonPlanService.list.mockResolvedValue([makePlan(goals)]);
      const events = await firstValueFrom(service.getEventsForTeam(TEAM_ID));
      expect(events.filter(e => e.type === 'season-goal')).toHaveLength(0);
    });

    it('sets a routerLink pointing to the season page', async () => {
      const goals = JSON.stringify([
        { id: 'g1', text: 'Win', done: false, deadline: '2026-03-01' },
      ]);
      seasonPlanService.list.mockResolvedValue([makePlan(goals)]);
      const events = await firstValueFrom(service.getEventsForTeam(TEAM_ID));
      const event = events.find(e => e.type === 'season-goal')!;
      expect(event.routerLink).toEqual(['/teams', String(TEAM_ID), 'season']);
    });
  });

  // ── journal mapping ──────────────────────────────────────────────

  describe('journal mapping', () => {
    it('maps a team note to a CalendarEvent with type "journal"', async () => {
      teamService.listNotes.mockResolvedValue([makeNote()]);
      const events = await firstValueFrom(service.getEventsForTeam(TEAM_ID));
      const event = events.find(e => e.type === 'journal');
      expect(event).toBeDefined();
      expect(event!.type).toBe('journal');
    });

    it('uses the note content (up to 60 chars) as the title', async () => {
      teamService.listNotes.mockResolvedValue([makeNote({ content: 'Good practice today' })]);
      const events = await firstValueFrom(service.getEventsForTeam(TEAM_ID));
      const event = events.find(e => e.type === 'journal')!;
      expect(event.title).toBe('Good practice today');
    });

    it('truncates long note content to 60 characters', async () => {
      const longContent = 'A'.repeat(80);
      teamService.listNotes.mockResolvedValue([makeNote({ content: longContent })]);
      const events = await firstValueFrom(service.getEventsForTeam(TEAM_ID));
      const event = events.find(e => e.type === 'journal')!;
      expect(event.title.length).toBe(60);
    });

    it('sets a routerLink pointing to the notes page', async () => {
      teamService.listNotes.mockResolvedValue([makeNote()]);
      const events = await firstValueFrom(service.getEventsForTeam(TEAM_ID));
      const event = events.find(e => e.type === 'journal')!;
      expect(event.routerLink).toEqual(['/teams', String(TEAM_ID), 'notes']);
    });
  });

  // ── combined output ──────────────────────────────────────────────

  describe('combined output', () => {
    it('returns an empty array when all sources are empty', async () => {
      const events = await firstValueFrom(service.getEventsForTeam(TEAM_ID));
      expect(events).toEqual([]);
    });

    it('returns events from all four sources in one array', async () => {
      gameService.getGamesByTeam.mockResolvedValue([makeGame()]);
      trainingService.list.mockResolvedValue([makeTraining()]);
      const goals = JSON.stringify([
        { id: 'g1', text: 'Win', done: false, deadline: '2026-03-01' },
      ]);
      seasonPlanService.list.mockResolvedValue([makePlan(goals)]);
      teamService.listNotes.mockResolvedValue([makeNote()]);

      const events = await firstValueFrom(service.getEventsForTeam(TEAM_ID));

      const types = events.map((e: CalendarEvent) => e.type);
      expect(types).toContain('game');
      expect(types).toContain('training');
      expect(types).toContain('season-goal');
      expect(types).toContain('journal');
      expect(events).toHaveLength(4);
    });
  });
});
