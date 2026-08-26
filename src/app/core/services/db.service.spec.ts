import { TestBed } from '@angular/core/testing';
import { DbService } from './db.service';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { Team } from '../../shared/models/models';

/**
 * A minimal fake of supabase-js's PostgrestFilterBuilder: every chain method
 * returns the same builder, and the builder itself is "thenable" (like the
 * real one) so `await this.db.from(...).select(...).eq(...)` resolves to
 * the configured { data, error } without a real network round-trip.
 */
function createQueryBuilder(result: { data: any; error: any }) {
  const builder: any = { eqCalls: [] as unknown[][] };
  const chain = (methodName: string) => vi.fn((...args: any[]) => {
    builder[`${methodName}Args`] = args;
    return builder;
  });
  builder.select = chain('select');
  builder.insert = chain('insert');
  builder.update = chain('update');
  builder.delete = chain('delete');
  builder.order = chain('order');
  builder.eq = vi.fn((...args: any[]) => {
    builder.eqCalls.push(args);
    return builder;
  });
  builder.single = vi.fn(() => builder);
  builder.maybeSingle = vi.fn(() => builder);
  builder.then = (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject);
  return builder;
}

describe('DbService', () => {
  let service: DbService;
  let fromMock: ReturnType<typeof vi.fn>;
  let authMock: any;

  function mockFrom(result: { data: any; error: any }) {
    const builder = createQueryBuilder(result);
    fromMock.mockReturnValueOnce(builder);
    return builder;
  }

  beforeEach(() => {
    fromMock = vi.fn();
    authMock = { currentUserId: vi.fn(() => 'user-1') };

    TestBed.configureTestingModule({
      providers: [
        DbService,
        { provide: SupabaseService, useValue: { client: { from: fromMock } } },
        { provide: AuthService, useValue: authMock },
      ],
    });

    service = TestBed.inject(DbService);
  });

  // ── listTeams ─────────────────────────────────────────────────────

  describe('listTeams', () => {
    it('selects all teams ordered by name', async () => {
      const teams: Team[] = [{ id: '1', name: 'Wolves' }];
      const builder = mockFrom({ data: teams, error: null });

      const result = await service.listTeams();

      expect(fromMock).toHaveBeenCalledWith('teams');
      expect(builder.selectArgs).toEqual(['*']);
      expect(builder.orderArgs).toEqual(['name']);
      expect(result).toEqual(teams);
    });

    it('throws when supabase returns an error', async () => {
      mockFrom({ data: null, error: new Error('network error') });
      await expect(service.listTeams()).rejects.toThrow('network error');
    });
  });

  // ── getTeam ───────────────────────────────────────────────────────

  describe('getTeam', () => {
    it('returns the team when found', async () => {
      const team: Team = { id: '1', name: 'Wolves' };
      mockFrom({ data: team, error: null });

      const result = await service.getTeam('1');

      expect(result).toEqual(team);
    });

    it('returns undefined when not found', async () => {
      mockFrom({ data: null, error: null });
      const result = await service.getTeam('999');
      expect(result).toBeUndefined();
    });
  });

  // ── saveTeam ──────────────────────────────────────────────────────

  describe('saveTeam', () => {
    it('inserts a new team with owner_id from the current user when no id is set', async () => {
      const builder = mockFrom({ data: { id: 'new-1' }, error: null });

      const id = await service.saveTeam({ name: 'New Team' } as Team);

      const insertPayload = builder.insertArgs[0];
      expect(insertPayload.owner_id).toBe('user-1');
      expect(insertPayload.name).toBe('New Team');
      expect(id).toBe('new-1');
    });

    it('updates an existing team by id and returns the same id', async () => {
      const builder = mockFrom({ data: null, error: null });

      const id = await service.saveTeam({ id: '5', name: 'Renamed' } as Team);

      expect(builder.updateArgs[0].name).toBe('Renamed');
      expect(builder.eqCalls).toEqual([['id', '5']]);
      expect(id).toBe('5');
    });

    it('throws when the insert fails', async () => {
      mockFrom({ data: null, error: new Error('duplicate key') });
      await expect(service.saveTeam({ name: 'X' } as Team)).rejects.toThrow('duplicate key');
    });
  });

  // ── deleteTeam ────────────────────────────────────────────────────

  describe('deleteTeam', () => {
    it('deletes by id', async () => {
      const builder = mockFrom({ data: null, error: null });
      await service.deleteTeam('7');
      expect(builder.deleteArgs).toEqual([]);
      expect(builder.eqCalls).toEqual([['id', '7']]);
    });
  });

  // ── listPlays — optional filters ────────────────────────────────

  describe('listPlays', () => {
    it('filters by teamId and opponentId when provided', async () => {
      const builder = mockFrom({ data: [], error: null });
      await service.listPlays({ teamId: 't1', opponentId: 'o1' });

      expect(builder.eqCalls).toContainEqual(['is_template', false]);
      expect(builder.eqCalls).toContainEqual(['team_id', 't1']);
      expect(builder.eqCalls).toContainEqual(['opponent_id', 'o1']);
    });

    it('omits team/opponent filters when not provided', async () => {
      const builder = mockFrom({ data: [], error: null });
      await service.listPlays();
      expect(builder.eqCalls).toEqual([['is_template', false]]);
    });
  });

  // ── toggleTaskDone — read-then-conditionally-update ────────────────

  describe('toggleTaskDone', () => {
    it('flips done from false to true', async () => {
      mockFrom({ data: { done: false }, error: null });
      const updateBuilder = mockFrom({ data: null, error: null });

      await service.toggleTaskDone('t1');

      expect(updateBuilder.updateArgs).toEqual([{ done: true }]);
    });

    it('flips done from true to false', async () => {
      mockFrom({ data: { done: true }, error: null });
      const updateBuilder = mockFrom({ data: null, error: null });

      await service.toggleTaskDone('t1');

      expect(updateBuilder.updateArgs).toEqual([{ done: false }]);
    });

    it('does nothing when the task is not found', async () => {
      mockFrom({ data: null, error: null });
      await service.toggleTaskDone('missing');
      expect(fromMock).toHaveBeenCalledTimes(1);
    });
  });
});
