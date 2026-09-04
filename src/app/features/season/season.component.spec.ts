import { TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { SeasonComponent } from './season.component';
import { SeasonPlanService } from '../../core/services/season-plan.service';
import { RecurringScheduleService } from '../calendar/recurring-schedule.service';
import { SeasonGoal, SeasonPlan } from '../../shared/models/models';

const GOALS: SeasonGoal[] = [
  { id: 'g1', text: 'Win the championship', done: false },
  { id: 'g2', text: 'Top defensive rating', done: true },
];

const PLANS: SeasonPlan[] = [
  {
    id: '1',
    team_id: '1',
    name: '2025-26 Season',
    season_year: '2025-26',
    start_date: '2025-09-01',
    end_date: '2026-06-30',
    goals: JSON.stringify(GOALS),
  },
  {
    id: '2',
    team_id: '1',
    name: '2024-25 Season',
    season_year: '2024-25',
    goals: '[]',
  },
];

describe('SeasonComponent', () => {
  let component: SeasonComponent;
  let service: any;

  beforeEach(async () => {
    service = {
      list:   vi.fn().mockResolvedValue([]),
      get:    vi.fn().mockResolvedValue(undefined),
      save:   vi.fn().mockResolvedValue('1'),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    const scheduleService = {
      list:   vi.fn().mockResolvedValue([]),
      add:    vi.fn().mockResolvedValue('1'),
      update: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [SeasonComponent],
      providers: [
        provideRouter([]),
        { provide: SeasonPlanService, useValue: service },
        { provide: RecurringScheduleService, useValue: scheduleService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: (k: string) => k === 'teamId' ? '1' : null } },
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(SeasonComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  // ── initial load ────────────────────────────────────────────────

  describe('initial load', () => {
    it('starts with an empty plans list', () => {
      expect(component.plans()).toEqual([]);
    });

    it('loads plans from the service', async () => {
      service.list.mockResolvedValue(PLANS);
      await component.load();
      expect(component.plans()).toHaveLength(2);
    });

    it('starts with showForm false', () => {
      expect(component.showForm()).toBe(false);
    });

    it('isEmpty is true when no plans are loaded', () => {
      expect(component.isEmpty()).toBe(true);
    });

    it('isEmpty is false once plans are loaded', async () => {
      service.list.mockResolvedValue(PLANS);
      await component.load();
      expect(component.isEmpty()).toBe(false);
    });
  });

  // ── selectPlan ──────────────────────────────────────────────────

  describe('selectPlan', () => {
    it('sets showForm to true', () => {
      component.selectPlan(PLANS[0]);
      expect(component.showForm()).toBe(true);
    });

    it('sets isNew to false', () => {
      component.selectPlan(PLANS[0]);
      expect(component.isNew()).toBe(false);
    });

    it('copies plan fields into editingPlan', () => {
      component.selectPlan(PLANS[0]);
      expect(component.editingPlan.name).toBe('2025-26 Season');
      expect(component.editingPlan.season_year).toBe('2025-26');
    });

    it('parses goals JSON into editingGoals signal', () => {
      component.selectPlan(PLANS[0]);
      expect(component.editingGoals()).toHaveLength(2);
      expect(component.editingGoals()[0].text).toBe('Win the championship');
    });

    it('handles a plan with empty goals array', () => {
      component.selectPlan(PLANS[1]);
      expect(component.editingGoals()).toEqual([]);
    });
  });

  // ── newPlan ─────────────────────────────────────────────────────

  describe('newPlan', () => {
    it('sets isNew to true', () => {
      component.newPlan();
      expect(component.isNew()).toBe(true);
    });

    it('sets showForm to true', () => {
      component.newPlan();
      expect(component.showForm()).toBe(true);
    });

    it('initialises editingPlan with an empty name', () => {
      component.newPlan();
      expect(component.editingPlan.name).toBe('');
    });

    it('initialises editingGoals as empty array', () => {
      component.newPlan();
      expect(component.editingGoals()).toEqual([]);
    });
  });

  // ── cancelEdit ──────────────────────────────────────────────────

  describe('cancelEdit', () => {
    it('hides the form', () => {
      component.newPlan();
      component.cancelEdit();
      expect(component.showForm()).toBe(false);
    });

    it('resets editingGoals to empty', () => {
      component.selectPlan(PLANS[0]);
      component.cancelEdit();
      expect(component.editingGoals()).toEqual([]);
    });
  });

  // ── save ────────────────────────────────────────────────────────

  describe('save', () => {
    it('calls service.save with the correct team_id', async () => {
      service.list.mockResolvedValue([{ ...PLANS[0], id: '1' }]);
      component.newPlan();
      component.editingPlan.name = 'New Plan';
      await component.save();
      const saved: SeasonPlan = service.save.mock.calls[0][0];
      expect(saved.team_id).toBe('1');
    });

    it('serialises editingGoals into the goals field', async () => {
      service.list.mockResolvedValue([{ ...PLANS[0], id: '1' }]);
      component.newPlan();
      component.editingPlan.name = 'New Plan';
      component.addGoal();
      component.updateGoalText(component.editingGoals()[0].id, 'Win it all');
      await component.save();
      const saved: SeasonPlan = service.save.mock.calls[0][0];
      const goals: SeasonGoal[] = JSON.parse(saved.goals!);
      expect(goals[0].text).toBe('Win it all');
    });

    it('does nothing when name is empty', async () => {
      component.newPlan();
      component.editingPlan.name = '';
      await component.save();
      expect(service.save).not.toHaveBeenCalled();
    });

    it('does nothing when name is whitespace', async () => {
      component.newPlan();
      component.editingPlan.name = '   ';
      await component.save();
      expect(service.save).not.toHaveBeenCalled();
    });

    it('sets isNew to false after saving', async () => {
      service.list.mockResolvedValue([{ ...PLANS[0], id: '1' }]);
      component.newPlan();
      component.editingPlan.name = 'New Plan';
      await component.save();
      expect(component.isNew()).toBe(false);
    });
  });

  // ── deletePlan ──────────────────────────────────────────────────

  describe('deletePlan', () => {
    it('calls service.delete with the correct id', async () => {
      service.list.mockResolvedValue([]);
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      await component.deletePlan('1', new MouseEvent('click'));
      expect(service.delete).toHaveBeenCalledWith('1');
    });

    it('does not delete when confirm returns false', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      await component.deletePlan('1', new MouseEvent('click'));
      expect(service.delete).not.toHaveBeenCalled();
    });

    it('hides form when the active plan is deleted', async () => {
      service.list.mockResolvedValue([]);
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      component.selectPlan(PLANS[0]);
      await component.deletePlan('1', new MouseEvent('click'));
      expect(component.showForm()).toBe(false);
    });
  });

  // ── goals checklist ─────────────────────────────────────────────

  describe('goals checklist', () => {
    beforeEach(() => component.newPlan());

    it('addGoal appends a new goal with done=false', () => {
      component.addGoal();
      expect(component.editingGoals()).toHaveLength(1);
      expect(component.editingGoals()[0].done).toBe(false);
    });

    it('removeGoal removes the goal with the given id', () => {
      component.addGoal();
      const id = component.editingGoals()[0].id;
      component.removeGoal(id);
      expect(component.editingGoals()).toHaveLength(0);
    });

    it('toggleGoal flips done from false to true', () => {
      component.addGoal();
      const id = component.editingGoals()[0].id;
      component.toggleGoal(id);
      expect(component.editingGoals()[0].done).toBe(true);
    });

    it('toggleGoal flips done from true to false', () => {
      component.editingGoals.set([{ id: 'g1', text: 'Win', done: true }]);
      component.toggleGoal('g1');
      expect(component.editingGoals()[0].done).toBe(false);
    });

    it('updateGoalText updates the text of the matching goal', () => {
      component.addGoal();
      const id = component.editingGoals()[0].id;
      component.updateGoalText(id, 'Championship');
      expect(component.editingGoals()[0].text).toBe('Championship');
    });

    it('updateGoalDeadline sets a deadline date string', () => {
      component.addGoal();
      const id = component.editingGoals()[0].id;
      component.updateGoalDeadline(id, '2026-03-01');
      expect(component.editingGoals()[0].deadline).toBe('2026-03-01');
    });

    it('updateGoalDeadline clears deadline when empty string is passed', () => {
      component.editingGoals.set([{ id: 'g1', text: 'Win', done: false, deadline: '2026-03-01' }]);
      component.updateGoalDeadline('g1', '');
      expect(component.editingGoals()[0].deadline).toBeUndefined();
    });
  });

  // ── goalCount / doneCount ────────────────────────────────────────

  describe('goalCount and doneCount', () => {
    it('goalCount returns the number of goals in a plan', () => {
      expect(component.goalCount(PLANS[0])).toBe(2);
    });

    it('goalCount returns 0 for a plan with empty goals', () => {
      expect(component.goalCount(PLANS[1])).toBe(0);
    });

    it('doneCount returns the number of completed goals', () => {
      expect(component.doneCount(PLANS[0])).toBe(1);
    });

    it('doneCount returns 0 when no goals are done', () => {
      const plan: SeasonPlan = {
        id: '3', team_id: '1', name: 'Plan', goals: JSON.stringify([
          { id: 'x', text: 'Goal', done: false },
        ]),
      };
      expect(component.doneCount(plan)).toBe(0);
    });
  });
});
