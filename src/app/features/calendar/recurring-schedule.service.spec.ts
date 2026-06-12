import { TestBed } from '@angular/core/testing';
import { RecurringScheduleService } from './recurring-schedule.service';
import { DbService } from '../../core/services/db.service';
import { RecurringSchedule } from '../../shared/models/models';

const TEAM_ID = 1;

function makeSchedule(overrides: Partial<RecurringSchedule> = {}): RecurringSchedule {
  return {
    id: 1,
    teamId: TEAM_ID,
    title: 'Team Training',
    daysOfWeek: [0], // Monday
    startTime: '09:00',
    durationMinutes: 90,
    startDate: '2026-06-01',
    endDate: '2026-06-30',
    active: true,
    ...overrides,
  };
}

// Monday 2026-06-08
const MON = new Date('2026-06-08T00:00:00');
// Sunday 2026-06-14
const SUN = new Date('2026-06-14T00:00:00');

describe('RecurringScheduleService', () => {
  let service: RecurringScheduleService;

  beforeEach(() => {
    const dbService = {
      listRecurringSchedules: vi.fn().mockResolvedValue([]),
      addRecurringSchedule:   vi.fn().mockResolvedValue(1),
      updateRecurringSchedule: vi.fn().mockResolvedValue(undefined),
      deleteRecurringSchedule: vi.fn().mockResolvedValue(undefined),
    };

    TestBed.configureTestingModule({
      providers: [
        RecurringScheduleService,
        { provide: DbService, useValue: dbService },
      ],
    });

    service = TestBed.inject(RecurringScheduleService);
  });

  // ── expandToEvents — basic ───────────────────────────────────────

  describe('expandToEvents', () => {
    it('returns an empty array when given no schedules', () => {
      const events = service.expandToEvents([], TEAM_ID, MON, SUN);
      expect(events).toEqual([]);
    });

    it('returns an empty array when the only schedule is inactive', () => {
      const schedule = makeSchedule({ active: false });
      const events = service.expandToEvents([schedule], TEAM_ID, MON, SUN);
      expect(events).toEqual([]);
    });

    it('generates an event for a matching day within the window', () => {
      // Monday schedule, window covers Mon 2026-06-08
      const schedule = makeSchedule({ daysOfWeek: [0], startDate: '2026-06-01', endDate: '2026-06-30' });
      const events = service.expandToEvents([schedule], TEAM_ID, MON, MON);
      expect(events).toHaveLength(1);
      expect(events[0].recurringDate).toBe('2026-06-08');
    });

    it('does not generate an event for a non-matching day', () => {
      // Monday-only schedule, window is only Tuesday 2026-06-09
      const TUE = new Date('2026-06-09T00:00:00');
      const schedule = makeSchedule({ daysOfWeek: [0] });
      const events = service.expandToEvents([schedule], TEAM_ID, TUE, TUE);
      expect(events).toHaveLength(0);
    });

    it('generates events for each matching day across a full week', () => {
      // Mon+Wed+Fri schedule over 2026-06-08 → 2026-06-14
      const schedule = makeSchedule({ daysOfWeek: [0, 2, 4] });
      const events = service.expandToEvents([schedule], TEAM_ID, MON, SUN);
      const dates = events.map(e => e.recurringDate).sort();
      expect(dates).toEqual(['2026-06-08', '2026-06-10', '2026-06-12']);
    });

    it('respects schedule startDate — does not produce events before it', () => {
      const schedule = makeSchedule({ daysOfWeek: [0], startDate: '2026-06-15', endDate: '2026-06-30' });
      // Window starts on Mon 2026-06-08, which is before schedule startDate
      const events = service.expandToEvents([schedule], TEAM_ID, MON, SUN);
      expect(events).toHaveLength(0);
    });

    it('respects schedule endDate — does not produce events after it', () => {
      const schedule = makeSchedule({ daysOfWeek: [0], startDate: '2026-06-01', endDate: '2026-06-07' });
      // Window is Mon 2026-06-08 → Sun 2026-06-14, entirely after schedule endDate
      const events = service.expandToEvents([schedule], TEAM_ID, MON, SUN);
      expect(events).toHaveLength(0);
    });

    it('generates events from multiple active schedules', () => {
      const s1 = makeSchedule({ id: 1, daysOfWeek: [0], title: 'Morning' });
      const s2 = makeSchedule({ id: 2, daysOfWeek: [2], title: 'Evening' });
      const TUE = new Date('2026-06-09T00:00:00');
      const WED = new Date('2026-06-11T00:00:00');
      const events = service.expandToEvents([s1, s2], TEAM_ID, MON, WED);
      expect(events).toHaveLength(2);
      expect(events.map(e => e.title).sort()).toEqual(['Evening', 'Morning']);
    });
  });

  // ── event shape ──────────────────────────────────────────────────

  describe('event shape', () => {
    it('sets type to "training"', () => {
      const schedule = makeSchedule({ daysOfWeek: [0] });
      const [event] = service.expandToEvents([schedule], TEAM_ID, MON, MON);
      expect(event.type).toBe('training');
    });

    it('sets isRecurring to true', () => {
      const schedule = makeSchedule({ daysOfWeek: [0] });
      const [event] = service.expandToEvents([schedule], TEAM_ID, MON, MON);
      expect(event.isRecurring).toBe(true);
    });

    it('copies startTime from the schedule', () => {
      const schedule = makeSchedule({ daysOfWeek: [0], startTime: '18:30' });
      const [event] = service.expandToEvents([schedule], TEAM_ID, MON, MON);
      expect(event.startTime).toBe('18:30');
    });

    it('copies durationMinutes from the schedule', () => {
      const schedule = makeSchedule({ daysOfWeek: [0], durationMinutes: 60 });
      const [event] = service.expandToEvents([schedule], TEAM_ID, MON, MON);
      expect(event.durationMinutes).toBe(60);
    });

    it('copies title from the schedule', () => {
      const schedule = makeSchedule({ daysOfWeek: [0], title: 'Shooting drill' });
      const [event] = service.expandToEvents([schedule], TEAM_ID, MON, MON);
      expect(event.title).toBe('Shooting drill');
    });

    it('sets recurringScheduleId to the schedule id', () => {
      const schedule = makeSchedule({ id: 42, daysOfWeek: [0] });
      const [event] = service.expandToEvents([schedule], TEAM_ID, MON, MON);
      expect(event.recurringScheduleId).toBe(42);
    });

    it('generates a unique id per occurrence', () => {
      const schedule = makeSchedule({ id: 5, daysOfWeek: [0, 2] });
      const WED = new Date('2026-06-11T00:00:00');
      const events = service.expandToEvents([schedule], TEAM_ID, MON, WED);
      const ids = events.map(e => e.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('sets routerLink to null (recurring events use promote flow)', () => {
      const schedule = makeSchedule({ daysOfWeek: [0] });
      const [event] = service.expandToEvents([schedule], TEAM_ID, MON, MON);
      expect(event.routerLink).toBeNull();
    });
  });

  // ── weekday mapping ──────────────────────────────────────────────

  describe('weekday mapping (Mon=0 … Sun=6)', () => {
    const cases: [string, number, string][] = [
      ['Monday',    0, '2026-06-08'],
      ['Tuesday',   1, '2026-06-09'],
      ['Wednesday', 2, '2026-06-10'],
      ['Thursday',  3, '2026-06-11'],
      ['Friday',    4, '2026-06-12'],
      ['Saturday',  5, '2026-06-13'],
      ['Sunday',    6, '2026-06-14'],
    ];

    for (const [dayName, dayIndex, isoDate] of cases) {
      it(`day index ${dayIndex} matches ${dayName} (${isoDate})`, () => {
        const schedule = makeSchedule({ daysOfWeek: [dayIndex] });
        const from = new Date(MON);
        const to   = new Date(SUN);
        const events = service.expandToEvents([schedule], TEAM_ID, from, to);
        expect(events.map(e => e.recurringDate)).toContain(isoDate);
      });
    }
  });
});
