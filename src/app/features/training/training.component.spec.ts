import { TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { TrainingComponent } from './training.component';
import { TrainingSessionService } from '../../core/services/training-session.service';
import { Drill, DrillCategory, SavedDrill, TrainingSession } from '../../shared/models/models';

const DRILLS: Drill[] = [
  { id: 'a', name: 'Warm Up',  duration_minutes: 10, description: '' },
  { id: 'b', name: 'Shooting', duration_minutes: 20, description: '' },
  { id: 'c', name: 'Defence',  duration_minutes: 15, description: '' },
];

function drillsJson(drills = DRILLS): string {
  return JSON.stringify(drills);
}

describe('TrainingComponent', () => {
  let component: TrainingComponent;
  let service: any;

  beforeEach(async () => {
    service = {
      list:                vi.fn().mockResolvedValue([]),
      listTemplates:       vi.fn().mockResolvedValue([]),
      listSavedDrills:     vi.fn().mockResolvedValue([]),
      save:                vi.fn().mockResolvedValue(1),
      delete:              vi.fn().mockResolvedValue(undefined),
      saveSavedDrill:      vi.fn().mockResolvedValue(1),
      deleteSavedDrill:    vi.fn().mockResolvedValue(undefined),
      listDrillCategories: vi.fn().mockResolvedValue([]),
      saveDrillCategory:   vi.fn().mockResolvedValue(1),
      deleteDrillCategory: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [TrainingComponent],
      providers: [
        provideRouter([]),
        { provide: TrainingSessionService, useValue: service },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap:      { get: (k: string) => k === 'teamId' ? '1' : null },
              queryParamMap: { get: () => null },
            },
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(TrainingComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  // ── formatDuration ─────────────────────────────────────────────

  describe('formatDuration', () => {
    it('returns empty string for falsy values', () => {
      expect(component.formatDuration(0)).toBe('');
      expect(component.formatDuration(undefined)).toBe('');
    });

    it('formats sub-60-minute durations as minutes only', () => {
      expect(component.formatDuration(45)).toBe('45m');
      expect(component.formatDuration(1)).toBe('1m');
    });

    it('formats exact hour multiples without trailing minutes', () => {
      expect(component.formatDuration(60)).toBe('1h');
      expect(component.formatDuration(120)).toBe('2h');
    });

    it('formats mixed hours and minutes', () => {
      expect(component.formatDuration(90)).toBe('1h 30m');
      expect(component.formatDuration(75)).toBe('1h 15m');
    });
  });

  // ── drillsInfo ─────────────────────────────────────────────────

  describe('drillsInfo', () => {
    it('returns zeros for an empty drills array', () => {
      const s: TrainingSession = { name: 'S', drills: '[]' };
      expect(component.drillsInfo(s)).toEqual({ count: 0, minutes: 0 });
    });

    it('returns correct count and summed minutes', () => {
      const s: TrainingSession = { name: 'S', drills: drillsJson() };
      expect(component.drillsInfo(s)).toEqual({ count: 3, minutes: 45 });
    });

    it('handles invalid JSON without throwing', () => {
      const s: TrainingSession = { name: 'S', drills: 'not-json' };
      expect(component.drillsInfo(s)).toEqual({ count: 0, minutes: 0 });
    });
  });

  // ── totalDrillMinutes ──────────────────────────────────────────

  describe('totalDrillMinutes', () => {
    it('is 0 when no drills are being edited', () => {
      expect(component.totalDrillMinutes()).toBe(0);
    });

    it('sums all drill durations reactively', () => {
      component.editingDrills.set(DRILLS);
      expect(component.totalDrillMinutes()).toBe(45);
    });

    it('treats missing duration_minutes as 0', () => {
      component.editingDrills.set([
        { id: 'x', name: 'X', duration_minutes: 0, description: '' },
      ]);
      expect(component.totalDrillMinutes()).toBe(0);
    });
  });

  // ── durationStatus ─────────────────────────────────────────────

  describe('durationStatus', () => {
    beforeEach(() => { component.editingDrills.set(DRILLS); }); // 45 min total

    it('returns null when no scheduled duration is set', () => {
      expect(component.durationStatus()).toBeNull();
    });

    it('returns "ok" when drills are well under the scheduled time', () => {
      component.scheduledMinutes.set(90);
      const s = component.durationStatus();
      expect(s?.state).toBe('ok');
      expect(s?.diff).toBe(-45);
    });

    it('returns "tight" when within 10 min of the limit (diff in (-10, 0])', () => {
      component.scheduledMinutes.set(50); // diff = -5
      expect(component.durationStatus()?.state).toBe('tight');
    });

    it('treats exactly 10 under as "ok" (boundary is exclusive)', () => {
      component.scheduledMinutes.set(55); // diff = -10, not > -10 so 'ok'
      expect(component.durationStatus()?.state).toBe('ok');
    });

    it('treats 9 under as "tight"', () => {
      component.scheduledMinutes.set(54); // diff = -9, which is > -10 so 'tight'
      expect(component.durationStatus()?.state).toBe('tight');
    });

    it('returns "over" when total exceeds scheduled', () => {
      component.scheduledMinutes.set(30);
      const s = component.durationStatus();
      expect(s?.state).toBe('over');
      expect(s?.diff).toBe(15);
    });

    it('returns "over" when total exactly equals scheduled (diff = 0 → not tight, not ok)', () => {
      component.scheduledMinutes.set(45); // diff = 0
      // diff > 0 is 'over'; diff = 0 falls into tight (diff > -10 && diff <= 0)
      expect(component.durationStatus()?.state).toBe('tight');
    });
  });

  // ── drill reordering ───────────────────────────────────────────

  describe('moveDrillUp', () => {
    beforeEach(() => { component.editingDrills.set([...DRILLS]); });

    it('swaps the drill with the one above it', () => {
      component.moveDrillUp(1);
      expect(component.editingDrills()[0].id).toBe('b');
      expect(component.editingDrills()[1].id).toBe('a');
      expect(component.editingDrills()[2].id).toBe('c');
    });

    it('is a no-op at index 0', () => {
      component.moveDrillUp(0);
      expect(component.editingDrills()[0].id).toBe('a');
    });
  });

  describe('moveDrillDown', () => {
    beforeEach(() => { component.editingDrills.set([...DRILLS]); });

    it('swaps the drill with the one below it', () => {
      component.moveDrillDown(0);
      expect(component.editingDrills()[0].id).toBe('b');
      expect(component.editingDrills()[1].id).toBe('a');
      expect(component.editingDrills()[2].id).toBe('c');
    });

    it('is a no-op at the last index', () => {
      component.moveDrillDown(2);
      expect(component.editingDrills()[2].id).toBe('c');
    });
  });

  // ── drag-and-drop reorder ──────────────────────────────────────

  describe('drag reorder', () => {
    beforeEach(() => { component.editingDrills.set([...DRILLS]); });

    it('moves the dragged item to the drop target position', () => {
      component.onDrillDragStart(0);
      component.onDrillDrop(2, { preventDefault: () => undefined } as DragEvent);
      expect(component.editingDrills()[0].id).toBe('b');
      expect(component.editingDrills()[1].id).toBe('c');
      expect(component.editingDrills()[2].id).toBe('a');
    });

    it('does not reorder when dropped on the same index', () => {
      const before = component.editingDrills().map(d => d.id);
      component.onDrillDragStart(1);
      component.onDrillDrop(1, { preventDefault: () => undefined } as DragEvent);
      expect(component.editingDrills().map(d => d.id)).toEqual(before);
    });

    it('clears drag state after drop', () => {
      component.onDrillDragStart(0);
      component.onDrillDrop(1, { preventDefault: () => undefined } as DragEvent);
      expect(component.dragIndex()).toBeNull();
      expect(component.dragOverIndex()).toBeNull();
    });

    it('clears drag state on dragend', () => {
      component.onDrillDragStart(0);
      component.onDrillDragEnd();
      expect(component.dragIndex()).toBeNull();
    });
  });

  // ── isDrillSaved ───────────────────────────────────────────────

  describe('isDrillSaved', () => {
    beforeEach(() => {
      component.savedDrills.set([
        { id: 1, name: 'Shooting Drill', duration_minutes: 20 },
      ]);
    });

    it('returns true for an exact match', () => {
      expect(component.isDrillSaved('Shooting Drill')).toBe(true);
    });

    it('is case-insensitive', () => {
      expect(component.isDrillSaved('shooting drill')).toBe(true);
      expect(component.isDrillSaved('SHOOTING DRILL')).toBe(true);
    });

    it('trims whitespace before comparing', () => {
      expect(component.isDrillSaved('  Shooting Drill  ')).toBe(true);
    });

    it('returns false for a non-matching name', () => {
      expect(component.isDrillSaved('Passing Drill')).toBe(false);
    });

    it('returns false for an empty string', () => {
      expect(component.isDrillSaved('')).toBe(false);
    });
  });

  // ── saveAsTemplate ─────────────────────────────────────────────

  describe('saveAsTemplate', () => {
    it('calls service.save with is_template=true and strips the id', async () => {
      service.list.mockResolvedValue([]);
      service.listTemplates.mockResolvedValue([]);
      const session: TrainingSession = {
        id: 5, team_id: 1, name: 'Morning', drills: '[]',
      };

      await component.saveAsTemplate(session, new Event('click'));

      const arg = service.save.mock.calls.at(-1)[0];
      expect(arg.is_template).toBe(true);
      expect(arg.name).toBe('Morning');
      expect(arg.id).toBeUndefined();
    });
  });

  // ── useTemplate ────────────────────────────────────────────────

  describe('useTemplate', () => {
    it('saves a copy without is_template and with today\'s date', async () => {
      const today = new Date().toISOString().split('T')[0];
      service.list.mockResolvedValue([{ id: 1, name: 'Morning Copy', drills: '[]', is_template: false, date: today }]);
      service.listTemplates.mockResolvedValue([]);

      const template: TrainingSession = {
        id: 99, team_id: 1, name: 'Morning', drills: '[]', is_template: true,
      };

      await component.useTemplate(template, new Event('click'));

      const arg = service.save.mock.calls.at(-1)[0];
      expect(arg.is_template).toBe(false);
      expect(arg.id).toBeUndefined();
      expect(arg.date).toBe(today);
    });
  });

  // ── onScheduledMinutesChange ───────────────────────────────────

  describe('onScheduledMinutesChange', () => {
    it('updates both editingSession and the scheduledMinutes signal', () => {
      component.onScheduledMinutesChange(75);
      expect(component.editingSession.duration_minutes).toBe(75);
      expect(component.scheduledMinutes()).toBe(75);
    });

    it('sets scheduledMinutes to undefined when value is 0', () => {
      component.onScheduledMinutesChange(0);
      expect(component.scheduledMinutes()).toBeUndefined();
    });
  });

  // ── groupedSavedDrills ─────────────────────────────────────────

  describe('groupedSavedDrills', () => {
    const CAT_X: DrillCategory = { id: 10, name: 'Defence' };
    const CAT_Y: DrillCategory = { id: 20, name: 'Offence' };

    function drill(id: number, category_id?: number): SavedDrill {
      return { id, name: `Drill ${id}`, duration_minutes: 10, category_id };
    }

    it('groups drills under their matching category', () => {
      component.drillCategories.set([CAT_X, CAT_Y]);
      component.savedDrills.set([drill(1, 10), drill(2, 20)]);

      const groups = component.groupedSavedDrills();
      expect(groups).toHaveLength(2);
      expect(groups[0].category?.id).toBe(10);
      expect(groups[0].drills.map(d => d.id)).toEqual([1]);
      expect(groups[1].category?.id).toBe(20);
      expect(groups[1].drills.map(d => d.id)).toEqual([2]);
    });

    it('puts drills without category_id into the uncategorized group', () => {
      component.drillCategories.set([CAT_X]);
      component.savedDrills.set([drill(1)]);

      const groups = component.groupedSavedDrills();
      expect(groups).toHaveLength(1);
      expect(groups[0].category).toBeNull();
      expect(groups[0].drills[0].id).toBe(1);
    });

    it('treats an unknown category_id as uncategorized', () => {
      component.drillCategories.set([CAT_X]);
      component.savedDrills.set([drill(1, 999)]);

      const groups = component.groupedSavedDrills();
      expect(groups).toHaveLength(1);
      expect(groups[0].category).toBeNull();
    });

    it('omits categories that have no matching drills', () => {
      component.drillCategories.set([CAT_X, CAT_Y]);
      component.savedDrills.set([drill(1, 10)]);

      const ids = component.groupedSavedDrills().map(g => g.category?.id);
      expect(ids).toEqual([10]);
    });

    it('appends the uncategorized group after all named category groups', () => {
      component.drillCategories.set([CAT_X]);
      component.savedDrills.set([drill(1, 10), drill(2)]);

      const groups = component.groupedSavedDrills();
      expect(groups).toHaveLength(2);
      expect(groups[0].category?.id).toBe(10);
      expect(groups[1].category).toBeNull();
    });

    it('returns an empty array when there are no drills', () => {
      component.drillCategories.set([CAT_X]);
      component.savedDrills.set([]);
      expect(component.groupedSavedDrills()).toEqual([]);
    });
  });

  // ── createDrillCategory ────────────────────────────────────────

  describe('createDrillCategory', () => {
    it('saves the category, clears the input, and reloads', async () => {
      const newCat: DrillCategory = { id: 5, name: 'Shooting' };
      service.saveDrillCategory.mockResolvedValue(5);
      service.listDrillCategories.mockResolvedValue([newCat]);

      component.newDrillCategoryName = 'Shooting';
      await component.createDrillCategory();

      expect(service.saveDrillCategory).toHaveBeenCalledWith({ name: 'Shooting' });
      expect(component.newDrillCategoryName).toBe('');
      expect(component.drillCategories()).toEqual([newCat]);
    });

    it('trims the name before saving', async () => {
      service.saveDrillCategory.mockResolvedValue(1);
      service.listDrillCategories.mockResolvedValue([]);

      component.newDrillCategoryName = '  Passing  ';
      await component.createDrillCategory();

      expect(service.saveDrillCategory).toHaveBeenCalledWith({ name: 'Passing' });
    });

    it('is a no-op when the input is blank', async () => {
      component.newDrillCategoryName = '   ';
      await component.createDrillCategory();
      expect(service.saveDrillCategory).not.toHaveBeenCalled();
    });
  });

  // ── deleteDrillCategory ────────────────────────────────────────

  describe('deleteDrillCategory', () => {
    it('calls service.deleteDrillCategory and reloads when confirmed', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      const event = { stopPropagation: vi.fn() } as unknown as Event;

      await component.deleteDrillCategory(7, event);

      expect(event.stopPropagation).toHaveBeenCalled();
      expect(service.deleteDrillCategory).toHaveBeenCalledWith(7);
      expect(service.listDrillCategories).toHaveBeenCalled();
      expect(service.listSavedDrills).toHaveBeenCalled();
    });

    it('aborts without deleting when the user cancels', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      const event = { stopPropagation: vi.fn() } as unknown as Event;

      await component.deleteDrillCategory(7, event);

      expect(service.deleteDrillCategory).not.toHaveBeenCalled();
    });
  });

  // ── toggleDrillFolder / isDrillFolderCollapsed ─────────────────

  describe('toggleDrillFolder / isDrillFolderCollapsed', () => {
    it('collapses a folder on the first toggle', () => {
      expect(component.isDrillFolderCollapsed(10)).toBe(false);
      component.toggleDrillFolder(10);
      expect(component.isDrillFolderCollapsed(10)).toBe(true);
    });

    it('expands a collapsed folder on the second toggle', () => {
      component.toggleDrillFolder(10);
      component.toggleDrillFolder(10);
      expect(component.isDrillFolderCollapsed(10)).toBe(false);
    });

    it('handles the null (uncategorized) folder key', () => {
      component.toggleDrillFolder(null);
      expect(component.isDrillFolderCollapsed(null)).toBe(true);
      component.toggleDrillFolder(null);
      expect(component.isDrillFolderCollapsed(null)).toBe(false);
    });

    it('collapses each folder independently', () => {
      component.toggleDrillFolder(10);
      expect(component.isDrillFolderCollapsed(10)).toBe(true);
      expect(component.isDrillFolderCollapsed(20)).toBe(false);
    });
  });

  // ── setDrillCategory ──────────────────────────────────────────

  describe('setDrillCategory', () => {
    it('calls saveSavedDrill with the new category_id and reloads the library', async () => {
      const drill: SavedDrill = { id: 3, name: 'Lay-ups', duration_minutes: 15 };
      service.listSavedDrills.mockResolvedValue([{ ...drill, category_id: 10 }]);

      await component.setDrillCategory(drill, 10);

      expect(service.saveSavedDrill).toHaveBeenCalledWith({ ...drill, category_id: 10 });
      expect(component.savedDrills()[0].category_id).toBe(10);
    });

    it('passes undefined to remove a category from a drill', async () => {
      const drill: SavedDrill = { id: 3, name: 'Lay-ups', duration_minutes: 15, category_id: 10 };
      service.listSavedDrills.mockResolvedValue([{ id: 3, name: 'Lay-ups', duration_minutes: 15 }]);

      await component.setDrillCategory(drill, undefined);

      expect(service.saveSavedDrill).toHaveBeenCalledWith({ ...drill, category_id: undefined });
    });
  });
});
