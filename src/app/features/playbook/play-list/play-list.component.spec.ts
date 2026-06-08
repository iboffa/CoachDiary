import { TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { PlayListComponent } from './play-list.component';
import { PlayService } from '../../../core/services/play.service';
import { PlayCategory, PlaySummary } from '../../../shared/models/models';

const CAT_A: PlayCategory = { id: 10, name: 'Zone Offense', team_id: 1 };
const CAT_B: PlayCategory = { id: 20, name: 'Transition',   team_id: 1 };

function play(id: number, category_id?: number): PlaySummary {
  return { id, name: `Play ${id}`, team_id: 1, category_id } as PlaySummary;
}

describe('PlayListComponent — categories', () => {
  let component: PlayListComponent;
  let service: any;

  beforeEach(async () => {
    service = {
      list:           vi.fn().mockResolvedValue([]),
      listTemplates:  vi.fn().mockResolvedValue([]),
      listCategories: vi.fn().mockResolvedValue([]),
      delete:         vi.fn().mockResolvedValue(undefined),
      deleteCategory: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [PlayListComponent],
      providers: [
        provideRouter([]),
        { provide: PlayService, useValue: service },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: { get: (k: string) => k === 'teamId' ? '1' : null },
            },
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(PlayListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  // ── groupedPlays ───────────────────────────────────────────────

  describe('groupedPlays', () => {
    it('groups plays under their matching category', () => {
      component.categories.set([CAT_A, CAT_B]);
      component.plays.set([play(1, 10), play(2, 20)]);

      const groups = component.groupedPlays();
      expect(groups).toHaveLength(2);
      expect(groups[0].category?.id).toBe(10);
      expect(groups[0].plays.map(p => p.id)).toEqual([1]);
      expect(groups[1].category?.id).toBe(20);
      expect(groups[1].plays.map(p => p.id)).toEqual([2]);
    });

    it('puts plays without category_id into the uncategorized group', () => {
      component.categories.set([CAT_A]);
      component.plays.set([play(1)]);

      const groups = component.groupedPlays();
      expect(groups).toHaveLength(1);
      expect(groups[0].category).toBeNull();
      expect(groups[0].plays[0].id).toBe(1);
    });

    it('treats null category_id as uncategorized', () => {
      component.categories.set([CAT_A]);
      component.plays.set([{ id: 1, name: 'X', team_id: 1, category_id: null as any }]);

      const groups = component.groupedPlays();
      expect(groups).toHaveLength(1);
      expect(groups[0].category).toBeNull();
    });

    it('treats an unknown category_id as uncategorized', () => {
      component.categories.set([CAT_A]);
      component.plays.set([play(1, 999)]);

      const groups = component.groupedPlays();
      expect(groups).toHaveLength(1);
      expect(groups[0].category).toBeNull();
    });

    it('omits categories that have no matching plays', () => {
      component.categories.set([CAT_A, CAT_B]);
      component.plays.set([play(1, 10)]);

      const ids = component.groupedPlays().map(g => g.category?.id);
      expect(ids).toEqual([10]);
    });

    it('appends the uncategorized group after all named category groups', () => {
      component.categories.set([CAT_A]);
      component.plays.set([play(1, 10), play(2)]);

      const groups = component.groupedPlays();
      expect(groups).toHaveLength(2);
      expect(groups[0].category?.id).toBe(10);
      expect(groups[1].category).toBeNull();
    });

    it('returns an empty array when there are no plays', () => {
      component.categories.set([CAT_A]);
      component.plays.set([]);
      expect(component.groupedPlays()).toEqual([]);
    });

    it('places multiple plays in the same category group', () => {
      component.categories.set([CAT_A]);
      component.plays.set([play(1, 10), play(2, 10), play(3, 10)]);

      const groups = component.groupedPlays();
      expect(groups).toHaveLength(1);
      expect(groups[0].plays.map(p => p.id)).toEqual([1, 2, 3]);
    });
  });

  // ── toggleFolder / isFolderCollapsed ───────────────────────────

  describe('toggleFolder / isFolderCollapsed', () => {
    it('collapses a folder on the first toggle', () => {
      expect(component.isFolderCollapsed(10)).toBe(false);
      component.toggleFolder(10);
      expect(component.isFolderCollapsed(10)).toBe(true);
    });

    it('expands a collapsed folder on the second toggle', () => {
      component.toggleFolder(10);
      component.toggleFolder(10);
      expect(component.isFolderCollapsed(10)).toBe(false);
    });

    it('handles the null (uncategorized) folder key', () => {
      component.toggleFolder(null);
      expect(component.isFolderCollapsed(null)).toBe(true);
      component.toggleFolder(null);
      expect(component.isFolderCollapsed(null)).toBe(false);
    });

    it('collapses each folder independently', () => {
      component.toggleFolder(10);
      expect(component.isFolderCollapsed(10)).toBe(true);
      expect(component.isFolderCollapsed(20)).toBe(false);
    });
  });

  // ── deleteCategory ─────────────────────────────────────────────

  describe('deleteCategory', () => {
    it('calls service.deleteCategory and reloads when confirmed', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      const event = { stopPropagation: vi.fn() } as unknown as MouseEvent;

      await component.deleteCategory(42, event);

      expect(event.stopPropagation).toHaveBeenCalled();
      expect(service.deleteCategory).toHaveBeenCalledWith(42);
      // list is called once on construction and once on reload
      expect(service.list).toHaveBeenCalledTimes(2);
    });

    it('aborts without calling service.deleteCategory when the user cancels', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      const event = { stopPropagation: vi.fn() } as unknown as MouseEvent;

      await component.deleteCategory(42, event);

      expect(service.deleteCategory).not.toHaveBeenCalled();
    });
  });
});
