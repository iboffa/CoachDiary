import { TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute, Router } from '@angular/router';
import { GamesListComponent } from './games-list.component';
import { GameService } from '../../../core/services/game.service';
import { Game } from '../../../shared/models/models';

function game(id: string, overrides: Partial<Game> = {}): Game {
  return {
    id,
    team_id: '1',
    date: '2026-05-01',
    opponent: `Opponent ${id}`,
    home_away: 'home',
    score_us: null,
    score_them: null,
    notes: '',
    ...overrides,
  };
}

const GAMES: Game[] = [
  game('1', { date: '2026-05-10', opponent: 'Bulls U18', score_us: 78, score_them: 65 }),
  game('2', { date: '2026-04-20', opponent: 'Celtics U18', score_us: null, score_them: null }),
  game('3', { date: '2026-03-05', opponent: 'Heat U18', home_away: 'away', score_us: 55, score_them: 60 }),
];

describe('GamesListComponent', () => {
  let component: GamesListComponent;
  let service: any;
  let router: Router;

  beforeEach(async () => {
    service = {
      getGamesByTeam: vi.fn().mockResolvedValue([]),
    };

    await TestBed.configureTestingModule({
      imports: [GamesListComponent],
      providers: [
        provideRouter([]),
        { provide: GameService, useValue: service },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: (k: string) => k === 'teamId' ? '1' : null } },
          },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);

    const fixture = TestBed.createComponent(GamesListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  // ── initial load ────────────────────────────────────────────────

  describe('initial load', () => {
    it('starts with an empty games list', () => {
      expect(component.games()).toEqual([]);
    });

    it('isEmpty is true when no games are loaded', () => {
      expect(component.isEmpty()).toBe(true);
    });

    it('loads games for the current teamId', async () => {
      service.getGamesByTeam.mockResolvedValue(GAMES);
      await component.load();
      expect(component.games()).toHaveLength(3);
    });

    it('isEmpty is false once games are loaded', async () => {
      service.getGamesByTeam.mockResolvedValue(GAMES);
      await component.load();
      expect(component.isEmpty()).toBe(false);
    });

    it('calls getGamesByTeam with the teamId from the route', () => {
      expect(service.getGamesByTeam).toHaveBeenCalledWith('1');
    });
  });

  // ── teamId ──────────────────────────────────────────────────────

  describe('teamId', () => {
    it('reads teamId as a string from the route snapshot', () => {
      expect(component.teamId).toBe('1');
    });
  });

  // ── score() helper ───────────────────────────────────────────────

  describe('score()', () => {
    it('returns "TBD" when score_us is null', () => {
      const g = game('1', { score_us: null, score_them: 50 });
      expect(component.score(g)).toBe('TBD');
    });

    it('returns "TBD" when score_them is null', () => {
      const g = game('1', { score_us: 80, score_them: null });
      expect(component.score(g)).toBe('TBD');
    });

    it('returns "TBD" when both scores are null', () => {
      const g = game('1', { score_us: null, score_them: null });
      expect(component.score(g)).toBe('TBD');
    });

    it('returns "X - Y" when both scores are set', () => {
      const g = game('1', { score_us: 78, score_them: 65 });
      expect(component.score(g)).toBe('78 - 65');
    });

    it('returns "0 - 0" when both scores are zero', () => {
      const g = game('1', { score_us: 0, score_them: 0 });
      expect(component.score(g)).toBe('0 - 0');
    });
  });

  // ── addGame navigation ───────────────────────────────────────────

  describe('addGame()', () => {
    it('navigates to the new-game route', () => {
      const spy = vi.spyOn(router, 'navigate');
      component.addGame();
      expect(spy).toHaveBeenCalledWith(['/teams', '1', 'games', 'new']);
    });
  });

  // ── openGame navigation ──────────────────────────────────────────

  describe('openGame()', () => {
    it('navigates to the game detail route with the given id', () => {
      const spy = vi.spyOn(router, 'navigate');
      component.openGame('42');
      expect(spy).toHaveBeenCalledWith(['/teams', '1', 'games', '42']);
    });
  });

  // ── rendered cards ────────────────────────────────────────────────

  describe('rendered cards', () => {
    it('renders one card element per game', async () => {
      service.getGamesByTeam.mockResolvedValue(GAMES);
      const fixture = TestBed.createComponent(GamesListComponent);
      await fixture.whenStable();
      fixture.detectChanges();
      const cards = fixture.nativeElement.querySelectorAll('[data-testid="game-card"]');
      expect(cards.length).toBe(GAMES.length);
    });

    it('renders no cards when the games list is empty', async () => {
      const fixture = TestBed.createComponent(GamesListComponent);
      await fixture.whenStable();
      fixture.detectChanges();
      const cards = fixture.nativeElement.querySelectorAll('[data-testid="game-card"]');
      expect(cards.length).toBe(0);
    });
  });
});
