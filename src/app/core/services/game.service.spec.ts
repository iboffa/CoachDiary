import { TestBed } from '@angular/core/testing';
import { GameService } from './game.service';
import { DbService } from './db.service';
import { Game } from '../../shared/models/models';

const GAME_1: Game = {
  id: '1',
  team_id: '10',
  date: '2026-05-01',
  opponent: 'Bulls U18',
  home_away: 'home',
  score_us: 78,
  score_them: 65,
  notes: 'Good win',
};

const GAME_2: Game = {
  id: '2',
  team_id: '10',
  date: '2026-04-15',
  opponent: 'Celtics U18',
  home_away: 'away',
  score_us: null,
  score_them: null,
  notes: '',
};

describe('GameService', () => {
  let service: GameService;
  let db: any;

  beforeEach(() => {
    db = {
      listGames:  vi.fn().mockResolvedValue([]),
      getGame:    vi.fn().mockResolvedValue(undefined),
      addGame:    vi.fn().mockResolvedValue('1'),
      updateGame: vi.fn().mockResolvedValue(undefined),
      deleteGame: vi.fn().mockResolvedValue(undefined),
    };

    TestBed.configureTestingModule({
      providers: [
        GameService,
        { provide: DbService, useValue: db },
      ],
    });

    service = TestBed.inject(GameService);
  });

  // ── getGamesByTeam ──────────────────────────────────────────────

  describe('getGamesByTeam', () => {
    it('returns games filtered by teamId from DbService', async () => {
      db.listGames.mockResolvedValue([GAME_1, GAME_2]);
      const result = await service.getGamesByTeam('10');
      expect(result).toEqual([GAME_1, GAME_2]);
      expect(db.listGames).toHaveBeenCalledWith('10');
    });

    it('returns an empty array when the team has no games', async () => {
      db.listGames.mockResolvedValue([]);
      const result = await service.getGamesByTeam('99');
      expect(result).toEqual([]);
    });

    it('passes the correct teamId to DbService', async () => {
      await service.getGamesByTeam('42');
      expect(db.listGames).toHaveBeenCalledWith('42');
    });
  });

  // ── getGame ─────────────────────────────────────────────────────

  describe('getGame', () => {
    it('returns a game by id from DbService', async () => {
      db.getGame.mockResolvedValue(GAME_1);
      const result = await service.getGame('1');
      expect(result).toEqual(GAME_1);
      expect(db.getGame).toHaveBeenCalledWith('1');
    });

    it('returns undefined when no game matches the id', async () => {
      db.getGame.mockResolvedValue(undefined);
      const result = await service.getGame('999');
      expect(result).toBeUndefined();
    });
  });

  // ── addGame ─────────────────────────────────────────────────────

  describe('addGame', () => {
    it('delegates to DbService.addGame with the provided payload', async () => {
      const payload: Omit<Game, 'id'> = {
        team_id: '10',
        date: '2026-06-01',
        opponent: 'Nets U18',
        home_away: 'home',
        score_us: null,
        score_them: null,
        notes: '',
      };
      db.addGame.mockResolvedValue('5');
      const id = await service.addGame(payload);
      expect(db.addGame).toHaveBeenCalledWith(payload);
      expect(id).toBe('5');
    });
  });

  // ── updateGame ──────────────────────────────────────────────────

  describe('updateGame', () => {
    it('delegates to DbService.updateGame with id and changes', async () => {
      const changes: Partial<Omit<Game, 'id'>> = { score_us: 80, score_them: 70 };
      await service.updateGame('1', changes);
      expect(db.updateGame).toHaveBeenCalledWith('1', changes);
    });
  });

  // ── deleteGame ──────────────────────────────────────────────────

  describe('deleteGame', () => {
    it('delegates to DbService.deleteGame with the correct id', async () => {
      await service.deleteGame('1');
      expect(db.deleteGame).toHaveBeenCalledWith('1');
    });
  });
});
