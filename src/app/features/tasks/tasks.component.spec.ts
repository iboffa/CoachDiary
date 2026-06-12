import { TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { TasksComponent } from './tasks.component';
import { TasksService } from '../../core/services/tasks.service';
import { PlayerService } from '../../core/services/player.service';
import { Task, Player } from '../../shared/models/models';

const PLAYERS: Player[] = [
  { id: 1, team_id: 10, name: 'Jordan', number: 23, position: 'SG' },
  { id: 2, team_id: 10, name: 'Pippen', number: 33, position: 'SF' },
];

const TASKS: Task[] = [
  {
    id: 1,
    teamId: 10,
    title: 'Review film',
    dueDate: '2026-06-20',
    done: false,
    createdAt: '2026-06-12T10:00:00.000Z',
  },
  {
    id: 2,
    teamId: 10,
    title: 'Update roster',
    done: true,
    createdAt: '2026-06-11T09:00:00.000Z',
  },
];

describe('TasksComponent', () => {
  let component: TasksComponent;
  let tasksService: any;
  let playerService: any;

  beforeEach(async () => {
    tasksService = {
      getTasksByTeam: vi.fn().mockResolvedValue([]),
      addTask:        vi.fn().mockResolvedValue(1),
      toggleDone:     vi.fn().mockResolvedValue(undefined),
      deleteTask:     vi.fn().mockResolvedValue(undefined),
    };

    playerService = {
      list: vi.fn().mockResolvedValue([]),
    };

    await TestBed.configureTestingModule({
      imports: [TasksComponent],
      providers: [
        provideRouter([]),
        { provide: TasksService, useValue: tasksService },
        { provide: PlayerService, useValue: playerService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: (k: string) => k === 'teamId' ? '10' : null } },
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(TasksComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  // ── initial render ──────────────────────────────────────────────

  describe('initial render', () => {
    it('creates the component', () => {
      expect(component).toBeTruthy();
    });

    it('reads teamId from route params', () => {
      expect(component.teamId).toBe(10);
    });

    it('starts with an empty task list when the service returns none', () => {
      expect(component.tasks()).toEqual([]);
    });

    it('shows the add-task form (isEmpty returns true)', () => {
      expect(component.isEmpty()).toBe(true);
    });
  });

  // ── task loading ────────────────────────────────────────────────

  describe('task loading', () => {
    it('populates tasks when service returns data', async () => {
      tasksService.getTasksByTeam.mockResolvedValue(TASKS);
      playerService.list.mockResolvedValue(PLAYERS);
      await (component as any).load();
      expect(component.tasks()).toHaveLength(2);
    });

    it('populates players when service returns data', async () => {
      tasksService.getTasksByTeam.mockResolvedValue([]);
      playerService.list.mockResolvedValue(PLAYERS);
      await (component as any).load();
      expect(component.players()).toHaveLength(2);
    });
  });

  // ── sortedTasks ─────────────────────────────────────────────────

  describe('sortedTasks', () => {
    it('places undone tasks before done tasks', async () => {
      tasksService.getTasksByTeam.mockResolvedValue(TASKS);
      await (component as any).load();
      const sorted = component.sortedTasks();
      expect(sorted[0].done).toBe(false);
      expect(sorted[1].done).toBe(true);
    });

    it('sorts undone tasks by dueDate ascending, nulls last', async () => {
      const tasks: Task[] = [
        { id: 3, teamId: 10, title: 'No date', done: false, createdAt: '' },
        { id: 4, teamId: 10, title: 'Later', dueDate: '2026-07-01', done: false, createdAt: '' },
        { id: 5, teamId: 10, title: 'Earlier', dueDate: '2026-06-15', done: false, createdAt: '' },
      ];
      tasksService.getTasksByTeam.mockResolvedValue(tasks);
      await (component as any).load();
      const sorted = component.sortedTasks();
      expect(sorted[0].title).toBe('Earlier');
      expect(sorted[1].title).toBe('Later');
      expect(sorted[2].title).toBe('No date');
    });
  });

  // ── addTask ─────────────────────────────────────────────────────

  describe('addTask', () => {
    it('does nothing when newTitle is empty', async () => {
      component.newTitle = '';
      await component.addTask();
      expect(tasksService.addTask).not.toHaveBeenCalled();
    });

    it('does nothing when newTitle is whitespace', async () => {
      component.newTitle = '   ';
      await component.addTask();
      expect(tasksService.addTask).not.toHaveBeenCalled();
    });

    it('calls addTask with correct teamId, title, and done=false', async () => {
      tasksService.getTasksByTeam.mockResolvedValue([]);
      component.newTitle = 'Scout opponents';
      await component.addTask();
      const call = tasksService.addTask.mock.calls[0][0];
      expect(call.teamId).toBe(10);
      expect(call.title).toBe('Scout opponents');
      expect(call.done).toBe(false);
    });

    it('resets newTitle after adding', async () => {
      tasksService.getTasksByTeam.mockResolvedValue([]);
      component.newTitle = 'Some task';
      await component.addTask();
      expect(component.newTitle).toBe('');
    });

    it('includes optional dueDate when set', async () => {
      tasksService.getTasksByTeam.mockResolvedValue([]);
      component.newTitle = 'Task with date';
      component.newDueDate = '2026-07-15';
      await component.addTask();
      const call = tasksService.addTask.mock.calls[0][0];
      expect(call.dueDate).toBe('2026-07-15');
    });

    it('omits dueDate when not set', async () => {
      tasksService.getTasksByTeam.mockResolvedValue([]);
      component.newTitle = 'Task without date';
      component.newDueDate = '';
      await component.addTask();
      const call = tasksService.addTask.mock.calls[0][0];
      expect(call.dueDate).toBeUndefined();
    });
  });

  // ── toggleDone ──────────────────────────────────────────────────

  describe('toggleDone', () => {
    it('calls tasksService.toggleDone with the task id', async () => {
      tasksService.getTasksByTeam.mockResolvedValue([]);
      const task = TASKS[0];
      await component.toggleDone(task);
      expect(tasksService.toggleDone).toHaveBeenCalledWith(task.id);
    });
  });

  // ── deleteTask ──────────────────────────────────────────────────

  describe('deleteTask', () => {
    it('calls tasksService.deleteTask with the correct id', async () => {
      tasksService.getTasksByTeam.mockResolvedValue([]);
      await component.deleteTask(42);
      expect(tasksService.deleteTask).toHaveBeenCalledWith(42);
    });
  });

  // ── playerName ──────────────────────────────────────────────────

  describe('playerName', () => {
    beforeEach(async () => {
      playerService.list.mockResolvedValue(PLAYERS);
      tasksService.getTasksByTeam.mockResolvedValue([]);
      await (component as any).load();
    });

    it('returns the player name when the id matches', () => {
      expect(component.playerName(1)).toBe('Jordan');
    });

    it('returns an empty string for unknown player id', () => {
      expect(component.playerName(999)).toBe('');
    });

    it('returns an empty string when playerId is undefined', () => {
      expect(component.playerName(undefined)).toBe('');
    });
  });
});
