import { TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute, Router } from '@angular/router';
import { GameDetailComponent } from './game-detail.component';
import { GameService } from '../../../core/services/game.service';
import { Game } from '../../../shared/models/models';

const EXISTING_GAME: Game = {
  id: '7',
  team_id: '1',
  date: '2026-05-10',
  start_time: '18:00',
  opponent: 'Bulls U18',
  home_away: 'home',
  score_us: 78,
  score_them: 65,
  notes: 'Great game',
};

function makeActivatedRoute(
  params: Record<string, string | null>,
  queryParams: Record<string, string | null> = {},
) {
  return {
    snapshot: {
      paramMap: {
        get: (k: string) => params[k] ?? null,
      },
      queryParamMap: {
        get: (k: string) => queryParams[k] ?? null,
      },
    },
  };
}

async function createComponent(
  routeParams: Record<string, string | null>,
  serviceOverrides: Partial<typeof defaultService> = {},
  queryParams: Record<string, string | null> = {},
) {
  const service = { ...defaultService, ...serviceOverrides };

  await TestBed.configureTestingModule({
    imports: [GameDetailComponent],
    providers: [
      provideRouter([]),
      { provide: GameService, useValue: service },
      { provide: ActivatedRoute, useValue: makeActivatedRoute(routeParams, queryParams) },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(GameDetailComponent);
  const component = fixture.componentInstance;
  // Prevent NG04002 errors from unmatched routes — tests that check navigation
  // should spy on router.navigate themselves after calling createComponent.
  const router = TestBed.inject(Router);
  vi.spyOn(router, 'navigate').mockResolvedValue(true);
  await fixture.whenStable();
  return { fixture, component, service };
}

const defaultService = {
  getGame:    vi.fn().mockResolvedValue(undefined),
  addGame:    vi.fn().mockResolvedValue('1'),
  updateGame: vi.fn().mockResolvedValue(undefined),
  deleteGame: vi.fn().mockResolvedValue(undefined),
};

describe('GameDetailComponent', () => {
  beforeEach(() => {
    // Reset all mocks between tests
    defaultService.getGame    = vi.fn().mockResolvedValue(undefined);
    defaultService.addGame    = vi.fn().mockResolvedValue('1');
    defaultService.updateGame = vi.fn().mockResolvedValue(undefined);
    defaultService.deleteGame = vi.fn().mockResolvedValue(undefined);
    TestBed.resetTestingModule();
  });

  // ── new game mode ───────────────────────────────────────────────

  describe('when gameId param is "new"', () => {
    it('sets isNew to true', async () => {
      const { component } = await createComponent({ teamId: '1', gameId: 'new' });
      expect(component.isNew).toBe(true);
    });

    it('does not call getGame', async () => {
      const getGame = vi.fn().mockResolvedValue(undefined);
      await createComponent({ teamId: '1', gameId: 'new' }, { getGame });
      expect(getGame).not.toHaveBeenCalled();
    });

    it('initialises game.opponent as an empty string', async () => {
      const { component } = await createComponent({ teamId: '1', gameId: 'new' });
      expect(component.game.opponent).toBe('');
    });

    it('initialises game.home_away as "home"', async () => {
      const { component } = await createComponent({ teamId: '1', gameId: 'new' });
      expect(component.game.home_away).toBe('home');
    });

    it('initialises score_us and score_them as null', async () => {
      const { component } = await createComponent({ teamId: '1', gameId: 'new' });
      expect(component.game.score_us).toBeNull();
      expect(component.game.score_them).toBeNull();
    });

    it('initialises date to today in ISO format', async () => {
      const today = new Date().toISOString().split('T')[0];
      const { component } = await createComponent({ teamId: '1', gameId: 'new' });
      expect(component.game.date).toBe(today);
    });

    it('pre-fills date from the ?date query param when present', async () => {
      const { component } = await createComponent(
        { teamId: '1', gameId: 'new' },
        {},
        { date: '2026-09-14' },
      );
      expect(component.game.date).toBe('2026-09-14');
    });

    it('initialises start_time as null', async () => {
      const { component } = await createComponent({ teamId: '1', gameId: 'new' });
      expect(component.game.start_time).toBeNull();
    });
  });

  // ── existing game mode ──────────────────────────────────────────

  describe('when gameId param is a string id', () => {
    it('sets isNew to false', async () => {
      const getGame = vi.fn().mockResolvedValue(EXISTING_GAME);
      const { component } = await createComponent({ teamId: '1', gameId: '7' }, { getGame });
      expect(component.isNew).toBe(false);
    });

    it('calls getGame with the string id from the route', async () => {
      const getGame = vi.fn().mockResolvedValue(EXISTING_GAME);
      await createComponent({ teamId: '1', gameId: '7' }, { getGame });
      expect(getGame).toHaveBeenCalledWith('7');
    });

    it('populates game fields from the loaded record', async () => {
      const getGame = vi.fn().mockResolvedValue(EXISTING_GAME);
      const { component } = await createComponent({ teamId: '1', gameId: '7' }, { getGame });
      expect(component.game.opponent).toBe('Bulls U18');
      expect(component.game.score_us).toBe(78);
      expect(component.game.score_them).toBe(65);
      expect(component.game.notes).toBe('Great game');
    });

    it('leaves game as default when getGame returns undefined', async () => {
      const getGame = vi.fn().mockResolvedValue(undefined);
      const { component } = await createComponent({ teamId: '1', gameId: '99' }, { getGame });
      expect(component.game.opponent).toBe('');
    });
  });

  // ── save — new game ─────────────────────────────────────────────

  describe('save() — new game', () => {
    it('calls addGame with the correct payload', async () => {
      const addGame = vi.fn().mockResolvedValue('1');
      const { component } = await createComponent({ teamId: '1', gameId: 'new' }, { addGame });
      component.game.opponent = 'Lakers U18';
      component.game.date = '2026-06-01';
      component.game.start_time = '19:30';
      component.game.home_away = 'away';
      component.game.score_us = 80;
      component.game.score_them = 70;
      component.game.notes = 'Tough game';

      await component.save();

      expect(addGame).toHaveBeenCalledWith({
        team_id: '1',
        date: '2026-06-01',
        start_time: '19:30',
        opponent: 'Lakers U18',
        home_away: 'away',
        score_us: 80,
        score_them: 70,
        notes: 'Tough game',
      });
    });

    it('does not call addGame when opponent is empty', async () => {
      const addGame = vi.fn().mockResolvedValue('1');
      const { component } = await createComponent({ teamId: '1', gameId: 'new' }, { addGame });
      component.game.opponent = '';
      await component.save();
      expect(addGame).not.toHaveBeenCalled();
    });

    it('does not call addGame when opponent is whitespace only', async () => {
      const addGame = vi.fn().mockResolvedValue('1');
      const { component } = await createComponent({ teamId: '1', gameId: 'new' }, { addGame });
      component.game.opponent = '   ';
      await component.save();
      expect(addGame).not.toHaveBeenCalled();
    });

    it('trims the opponent name before saving', async () => {
      const addGame = vi.fn().mockResolvedValue('1');
      const { component } = await createComponent({ teamId: '1', gameId: 'new' }, { addGame });
      component.game.opponent = '  Bulls U18  ';
      await component.save();
      const payload = addGame.mock.calls[0][0];
      expect(payload.opponent).toBe('Bulls U18');
    });

    it('navigates back after a successful save', async () => {
      const addGame = vi.fn().mockResolvedValue('1');
      const { component } = await createComponent({ teamId: '1', gameId: 'new' }, { addGame });
      const router = TestBed.inject(Router);
      const spy = vi.spyOn(router, 'navigate');
      component.game.opponent = 'Bulls';
      await component.save();
      expect(spy).toHaveBeenCalledWith(['/teams', '1', 'games']);
    });

    it('resets saving to false after a successful save', async () => {
      const addGame = vi.fn().mockResolvedValue('1');
      const { component } = await createComponent({ teamId: '1', gameId: 'new' }, { addGame });
      component.game.opponent = 'Bulls';
      await component.save();
      expect(component.saving()).toBe(false);
    });

    it('resets saving to false even when addGame throws', async () => {
      const addGame = vi.fn().mockRejectedValue(new Error('DB error'));
      const { component } = await createComponent({ teamId: '1', gameId: 'new' }, { addGame });
      component.game.opponent = 'Bulls';
      await expect(component.save()).rejects.toThrow('DB error');
      expect(component.saving()).toBe(false);
    });
  });

  // ── save — existing game ─────────────────────────────────────────

  describe('save() — existing game', () => {
    it('calls updateGame (not addGame) for an existing game', async () => {
      const getGame    = vi.fn().mockResolvedValue(EXISTING_GAME);
      const updateGame = vi.fn().mockResolvedValue(undefined);
      const addGame    = vi.fn().mockResolvedValue('1');
      const { component } = await createComponent(
        { teamId: '1', gameId: '7' },
        { getGame, updateGame, addGame },
      );
      await component.save();
      expect(updateGame).toHaveBeenCalled();
      expect(addGame).not.toHaveBeenCalled();
    });

    it('calls updateGame with the correct game id', async () => {
      const getGame    = vi.fn().mockResolvedValue(EXISTING_GAME);
      const updateGame = vi.fn().mockResolvedValue(undefined);
      const { component } = await createComponent(
        { teamId: '1', gameId: '7' },
        { getGame, updateGame },
      );
      await component.save();
      expect(updateGame.mock.calls[0][0]).toBe('7');
    });

    it('navigates back after successfully updating', async () => {
      const getGame    = vi.fn().mockResolvedValue(EXISTING_GAME);
      const updateGame = vi.fn().mockResolvedValue(undefined);
      const { component } = await createComponent(
        { teamId: '1', gameId: '7' },
        { getGame, updateGame },
      );
      const router = TestBed.inject(Router);
      const spy = vi.spyOn(router, 'navigate');
      await component.save();
      expect(spy).toHaveBeenCalledWith(['/teams', '1', 'games']);
    });
  });

  // ── deleteGame ───────────────────────────────────────────────────

  describe('deleteGame()', () => {
    it('calls deleteGame with the correct id when confirm returns true', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      const getGame    = vi.fn().mockResolvedValue(EXISTING_GAME);
      const deleteGame = vi.fn().mockResolvedValue(undefined);
      const { component } = await createComponent(
        { teamId: '1', gameId: '7' },
        { getGame, deleteGame },
      );
      await component.deleteGame();
      expect(deleteGame).toHaveBeenCalledWith('7');
    });

    it('navigates away after deletion', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      const getGame    = vi.fn().mockResolvedValue(EXISTING_GAME);
      const deleteGame = vi.fn().mockResolvedValue(undefined);
      const { component } = await createComponent(
        { teamId: '1', gameId: '7' },
        { getGame, deleteGame },
      );
      const router = TestBed.inject(Router);
      const spy = vi.spyOn(router, 'navigate');
      await component.deleteGame();
      expect(spy).toHaveBeenCalledWith(['/teams', '1', 'games']);
    });

    it('does not call deleteGame when confirm returns false', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      const getGame    = vi.fn().mockResolvedValue(EXISTING_GAME);
      const deleteGame = vi.fn().mockResolvedValue(undefined);
      const { component } = await createComponent(
        { teamId: '1', gameId: '7' },
        { getGame, deleteGame },
      );
      await component.deleteGame();
      expect(deleteGame).not.toHaveBeenCalled();
    });
  });

  // ── teamId parsing ────────────────────────────────────────────────

  describe('teamId', () => {
    it('reads teamId as a string from the route snapshot', async () => {
      const { component } = await createComponent({ teamId: '5', gameId: 'new' });
      expect(component.teamId).toBe('5');
    });

    it('defaults teamId to empty string when route param is missing', async () => {
      const { component } = await createComponent({ teamId: null, gameId: 'new' });
      expect(component.teamId).toBe('');
    });
  });
});
