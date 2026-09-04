import { TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { CalendarComponent } from './calendar.component';
import { CalendarService } from './calendar.service';
import { CalendarCustomEventService } from './calendar-custom-event.service';
import { RecurringScheduleService } from './recurring-schedule.service';
import { CalendarEvent } from './calendar-event.model';

function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: 'game-1',
    date: new Date('2026-06-15T00:00:00'),
    title: 'Match vs Bulls',
    type: 'game',
    start_time: null,
    duration_minutes: 120,
    routerLink: ['/teams', '1', 'games', '1'],
    ...overrides,
  };
}

async function createComponent(events: CalendarEvent[] = []) {
  const calendarService = {
    getEventsForTeam: vi.fn().mockReturnValue(of(events)),
  };
  const customEventService = {
    create: vi.fn().mockResolvedValue('1'),
    delete: vi.fn().mockResolvedValue(undefined),
    listByTeam: vi.fn().mockResolvedValue([]),
  };
  const recurringScheduleService = {
    list: vi.fn().mockResolvedValue([]),
    expandToEvents: vi.fn().mockReturnValue([]),
  };

  await TestBed.configureTestingModule({
    imports: [CalendarComponent],
    providers: [
      provideRouter([]),
      { provide: CalendarService, useValue: calendarService },
      { provide: CalendarCustomEventService, useValue: customEventService },
      { provide: RecurringScheduleService, useValue: recurringScheduleService },
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { paramMap: { get: () => '1' } } },
      },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(CalendarComponent);
  const component = fixture.componentInstance;
  fixture.detectChanges();
  await fixture.whenStable();
  return { fixture, component, calendarService };
}

describe('CalendarComponent', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  // ── chipLabel ──────────────────────────────────────────────────

  describe('chipLabel()', () => {
    it('returns the event title when no start_time is set', async () => {
      const { component } = await createComponent();
      const ev = makeEvent({ title: 'Team Training', start_time: null });
      expect(component.chipLabel(ev)).toBe('Team Training');
    });

    it('prepends start_time when set', async () => {
      const { component } = await createComponent();
      const ev = makeEvent({ title: 'Team Training', start_time: '09:00' });
      expect(component.chipLabel(ev)).toBe('09:00 Team Training');
    });

    it('prepends the recurring symbol when isRecurring is true', async () => {
      const { component } = await createComponent();
      const ev = makeEvent({ title: 'Training', start_time: null, isRecurring: true });
      expect(component.chipLabel(ev)).toBe('↻ Training');
    });

    it('prepends both recurring symbol and start_time', async () => {
      const { component } = await createComponent();
      const ev = makeEvent({ title: 'Training', start_time: '08:30', isRecurring: true });
      expect(component.chipLabel(ev)).toBe('↻ 08:30 Training');
    });
  });

  // ── typeLabel ──────────────────────────────────────────────────

  describe('typeLabel()', () => {
    it('returns "Game" for type "game"', async () => {
      const { component } = await createComponent();
      expect(component.typeLabel('game')).toBe('Game');
    });

    it('returns "Training" for type "training"', async () => {
      const { component } = await createComponent();
      expect(component.typeLabel('training')).toBe('Training');
    });

    it('returns "Meeting" for type "meeting"', async () => {
      const { component } = await createComponent();
      expect(component.typeLabel('meeting')).toBe('Meeting');
    });

    it('returns "Season Goal" for type "season-goal"', async () => {
      const { component } = await createComponent();
      expect(component.typeLabel('season-goal')).toBe('Season Goal');
    });

    it('returns "Journal" for type "journal"', async () => {
      const { component } = await createComponent();
      expect(component.typeLabel('journal')).toBe('Journal');
    });
  });

  // ── timeDurationLabel ──────────────────────────────────────────

  describe('timeDurationLabel()', () => {
    it('returns empty string when neither start_time nor duration is set', async () => {
      const { component } = await createComponent();
      const ev = makeEvent({ start_time: null, duration_minutes: null });
      expect(component.timeDurationLabel(ev)).toBe('');
    });

    it('returns only start_time when no duration', async () => {
      const { component } = await createComponent();
      const ev = makeEvent({ start_time: '10:00', duration_minutes: null });
      expect(component.timeDurationLabel(ev)).toBe('10:00');
    });

    it('returns only duration when no start_time', async () => {
      const { component } = await createComponent();
      const ev = makeEvent({ start_time: null, duration_minutes: 60 });
      expect(component.timeDurationLabel(ev)).toBe('60 min');
    });

    it('joins start_time and duration with " · " when both are set', async () => {
      const { component } = await createComponent();
      const ev = makeEvent({ start_time: '10:00', duration_minutes: 90 });
      expect(component.timeDurationLabel(ev)).toBe('10:00 · 90 min');
    });
  });

  // ── visibleChips / overflowCount ──────────────────────────────

  describe('visibleChips() and overflowCount()', () => {
    it('shows all events in week view regardless of count', async () => {
      const { component } = await createComponent();
      component.setViewMode('week');
      const events = [1, 2, 3, 4, 5].map(i => makeEvent({ id: `ev-${i}` }));
      expect(component.visibleChips(events)).toHaveLength(5);
      expect(component.overflowCount(events)).toBe(0);
    });

    it('shows at most 3 chips in month view', async () => {
      const { component } = await createComponent();
      component.setViewMode('month');
      const events = [1, 2, 3, 4, 5].map(i => makeEvent({ id: `ev-${i}` }));
      expect(component.visibleChips(events)).toHaveLength(3);
    });

    it('reports overflow count correctly in month view', async () => {
      const { component } = await createComponent();
      component.setViewMode('month');
      const events = [1, 2, 3, 4, 5].map(i => makeEvent({ id: `ev-${i}` }));
      expect(component.overflowCount(events)).toBe(2);
    });

    it('reports 0 overflow when events count is 3 or fewer in month view', async () => {
      const { component } = await createComponent();
      component.setViewMode('month');
      const events = [1, 2, 3].map(i => makeEvent({ id: `ev-${i}` }));
      expect(component.overflowCount(events)).toBe(0);
    });
  });

  // ── dayLabel ──────────────────────────────────────────────────

  describe('dayLabel()', () => {
    it('returns the day-of-month as a string', async () => {
      const { component } = await createComponent();
      expect(component.dayLabel(new Date('2026-06-01T00:00:00'))).toBe('1');
      expect(component.dayLabel(new Date('2026-06-15T00:00:00'))).toBe('15');
      expect(component.dayLabel(new Date('2026-06-30T00:00:00'))).toBe('30');
    });
  });

  // ── view mode ─────────────────────────────────────────────────

  describe('setViewMode()', () => {
    it('starts in month view', async () => {
      const { component } = await createComponent();
      expect(component.viewMode()).toBe('month');
    });

    it('switches to week view', async () => {
      const { component } = await createComponent();
      component.setViewMode('week');
      expect(component.viewMode()).toBe('week');
    });

    it('switches back to month view', async () => {
      const { component } = await createComponent();
      component.setViewMode('week');
      component.setViewMode('month');
      expect(component.viewMode()).toBe('month');
    });

    it('clears the popover when switching view', async () => {
      const { component } = await createComponent();
      // Simulate an open popover
      component['popoverDay'].set(new Date());
      component['popoverPosition'].set({ top: 0, left: 0 });
      component.setViewMode('week');
      expect(component['popoverDay']()).toBeNull();
    });
  });

  // ── navigation ────────────────────────────────────────────────

  describe('month navigation', () => {
    it('prev() decrements the month', async () => {
      const { component } = await createComponent();
      component.month.set(5); // June
      component.prev();
      expect(component.month()).toBe(4);
    });

    it('prev() wraps from January to December and decrements year', async () => {
      const { component } = await createComponent();
      component.month.set(0);
      component.year.set(2026);
      component.prev();
      expect(component.month()).toBe(11);
      expect(component.year()).toBe(2025);
    });

    it('next() increments the month', async () => {
      const { component } = await createComponent();
      component.month.set(5);
      component.next();
      expect(component.month()).toBe(6);
    });

    it('next() wraps from December to January and increments year', async () => {
      const { component } = await createComponent();
      component.month.set(11);
      component.year.set(2025);
      component.next();
      expect(component.month()).toBe(0);
      expect(component.year()).toBe(2026);
    });
  });

  // ── selectDay ─────────────────────────────────────────────────

  describe('selectDay()', () => {
    it('sets selectedDay to the clicked date', async () => {
      const { component } = await createComponent();
      const date = new Date('2026-06-15T00:00:00');
      component.selectDay({ date, isCurrentMonth: true, isToday: false, events: [] });
      expect(component.selectedDay()?.getTime()).toBe(date.getTime());
    });

    it('clears selectedDay when the same date is clicked again', async () => {
      const { component } = await createComponent();
      const date = new Date('2026-06-15T00:00:00');
      const day = { date, isCurrentMonth: true, isToday: false, events: [] };
      component.selectDay(day);
      component.selectDay(day);
      expect(component.selectedDay()).toBeNull();
    });
  });

  // ── selectedDayEvents ─────────────────────────────────────────

  describe('selectedDayEvents()', () => {
    it('returns events matching the selected day', async () => {
      const ev = makeEvent({ date: new Date('2026-06-15T00:00:00') });
      const { component } = await createComponent([ev]);
      component.selectedDay.set(new Date('2026-06-15T00:00:00'));
      expect(component.selectedDayEvents()).toHaveLength(1);
      expect(component.selectedDayEvents()[0].id).toBe(ev.id);
    });

    it('returns an empty array when no day is selected', async () => {
      const ev = makeEvent({ date: new Date('2026-06-15T00:00:00') });
      const { component } = await createComponent([ev]);
      expect(component.selectedDayEvents()).toHaveLength(0);
    });

    it('returns an empty array when the selected day has no events', async () => {
      const { component } = await createComponent([]);
      component.selectedDay.set(new Date('2026-06-15T00:00:00'));
      expect(component.selectedDayEvents()).toHaveLength(0);
    });
  });
});
