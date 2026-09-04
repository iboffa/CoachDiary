import { TestBed } from '@angular/core/testing';
import { TasksService } from './tasks.service';
import { DbService } from './db.service';
import { Task } from '../../shared/models/models';

const TASK_1: Task = {
  id: '1',
  team_id: '10',
  title: 'Review game tape',
  due_date: '2026-06-20',
  done: false,
  created_at: '2026-06-12T10:00:00.000Z',
};

const TASK_2: Task = {
  id: '2',
  team_id: '10',
  title: 'Update training plan',
  done: true,
  created_at: '2026-06-11T08:00:00.000Z',
};

const TASK_PLAYER: Task = {
  id: '3',
  team_id: '10',
  title: 'Work on free throws',
  due_date: '2026-06-25',
  done: false,
  player_id: '5',
  created_at: '2026-06-12T09:00:00.000Z',
};

describe('TasksService', () => {
  let service: TasksService;
  let db: any;

  beforeEach(() => {
    db = {
      listTasksByTeam:   vi.fn().mockResolvedValue([]),
      listTasksByPlayer: vi.fn().mockResolvedValue([]),
      addTask:           vi.fn().mockResolvedValue('1'),
      updateTask:        vi.fn().mockResolvedValue(undefined),
      deleteTask:        vi.fn().mockResolvedValue(undefined),
      toggleTaskDone:    vi.fn().mockResolvedValue(undefined),
    };

    TestBed.configureTestingModule({
      providers: [
        TasksService,
        { provide: DbService, useValue: db },
      ],
    });

    service = TestBed.inject(TasksService);
  });

  // ── getTasksByTeam ──────────────────────────────────────────────

  describe('getTasksByTeam', () => {
    it('returns all tasks for the given team', async () => {
      db.listTasksByTeam.mockResolvedValue([TASK_1, TASK_2]);
      const result = await service.getTasksByTeam('10');
      expect(result).toEqual([TASK_1, TASK_2]);
      expect(db.listTasksByTeam).toHaveBeenCalledWith('10');
    });

    it('returns an empty array when the team has no tasks', async () => {
      db.listTasksByTeam.mockResolvedValue([]);
      const result = await service.getTasksByTeam('99');
      expect(result).toEqual([]);
    });

    it('passes the correct teamId to DbService', async () => {
      await service.getTasksByTeam('42');
      expect(db.listTasksByTeam).toHaveBeenCalledWith('42');
    });
  });

  // ── getTasksByPlayer ────────────────────────────────────────────

  describe('getTasksByPlayer', () => {
    it('returns tasks filtered by playerId within a team', async () => {
      db.listTasksByPlayer.mockResolvedValue([TASK_PLAYER]);
      const result = await service.getTasksByPlayer('10', '5');
      expect(result).toEqual([TASK_PLAYER]);
      expect(db.listTasksByPlayer).toHaveBeenCalledWith('10', '5');
    });

    it('returns an empty array when the player has no tasks', async () => {
      db.listTasksByPlayer.mockResolvedValue([]);
      const result = await service.getTasksByPlayer('10', '99');
      expect(result).toEqual([]);
    });
  });

  // ── addTask ─────────────────────────────────────────────────────

  describe('addTask', () => {
    it('delegates to DbService.addTask and returns the new id', async () => {
      const payload: Omit<Task, 'id'> = {
        team_id: '10',
        title: 'Scout opponents',
        done: false,
        created_at: '2026-06-12T10:00:00.000Z',
      };
      db.addTask.mockResolvedValue('7');
      const id = await service.addTask(payload);
      expect(db.addTask).toHaveBeenCalledWith(payload);
      expect(id).toBe('7');
    });

    it('forwards optional due_date and player_id', async () => {
      const payload: Omit<Task, 'id'> = {
        team_id: '10',
        title: 'Drill session',
        due_date: '2026-07-01',
        done: false,
        player_id: '3',
        created_at: '2026-06-12T10:00:00.000Z',
      };
      await service.addTask(payload);
      expect(db.addTask).toHaveBeenCalledWith(payload);
    });
  });

  // ── updateTask ──────────────────────────────────────────────────

  describe('updateTask', () => {
    it('delegates to DbService.updateTask with id and changes', async () => {
      const changes: Partial<Omit<Task, 'id'>> = { title: 'Renamed task' };
      await service.updateTask('1', changes);
      expect(db.updateTask).toHaveBeenCalledWith('1', changes);
    });
  });

  // ── deleteTask ──────────────────────────────────────────────────

  describe('deleteTask', () => {
    it('delegates to DbService.deleteTask with the correct id', async () => {
      await service.deleteTask('2');
      expect(db.deleteTask).toHaveBeenCalledWith('2');
    });
  });

  // ── toggleDone ──────────────────────────────────────────────────

  describe('toggleDone', () => {
    it('delegates to DbService.toggleTaskDone with the correct id', async () => {
      await service.toggleDone('3');
      expect(db.toggleTaskDone).toHaveBeenCalledWith('3');
    });
  });
});
