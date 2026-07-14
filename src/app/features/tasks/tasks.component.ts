import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TasksService } from '../../core/services/tasks.service';
import { PlayerService } from '../../core/services/player.service';
import { Task, Player } from '../../shared/models/models';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.scss',
})
export class TasksComponent {
  private readonly tasksService = inject(TasksService);
  private readonly playerService = inject(PlayerService);
  private readonly route = inject(ActivatedRoute);

  readonly teamId: string = (() => {
    const raw = this.route.snapshot.paramMap.get('teamId');
    return raw ?? '';
  })();

  readonly tasks = signal<Task[]>([]);
  readonly players = signal<Player[]>([]);

  readonly sortedTasks = computed<Task[]>(() => {
    const all = this.tasks();
    const undone = all.filter(t => !t.done).sort((a, b) => {
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return a.due_date.localeCompare(b.due_date);
    });
    const done = all.filter(t => t.done).sort((a, b) => {
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return a.due_date.localeCompare(b.due_date);
    });
    return [...undone, ...done];
  });

  readonly isEmpty = computed(() => this.tasks().length === 0);

  readonly today = new Date().toISOString().split('T')[0];

  newTitle = '';
  newDueDate = '';
  newPlayerId: string | '' = '';

  constructor() {
    this.load();
  }

  private async load(): Promise<void> {
    const [tasks, players] = await Promise.all([
      this.tasksService.getTasksByTeam(this.teamId),
      this.playerService.list(this.teamId),
    ]);
    this.tasks.set(tasks);
    this.players.set(players);
  }

  async addTask(): Promise<void> {
    if (!this.newTitle.trim()) return;
    await this.tasksService.addTask({
      team_id: this.teamId,
      title: this.newTitle.trim(),
      due_date: this.newDueDate || undefined,
      done: false,
      player_id: this.newPlayerId !== '' ? this.newPlayerId : undefined,
      created_at: new Date().toISOString(),
    });
    this.newTitle = '';
    this.newDueDate = '';
    this.newPlayerId = '';
    await this.reload();
  }

  async toggleDone(task: Task): Promise<void> {
    await this.tasksService.toggleDone(task.id!);
    await this.reload();
  }

  async deleteTask(id: string): Promise<void> {
    await this.tasksService.deleteTask(id);
    await this.reload();
  }

  playerName(playerId: string | undefined): string {
    if (!playerId) return '';
    const p = this.players().find(pl => pl.id === playerId);
    return p ? p.name : '';
  }

  private async reload(): Promise<void> {
    this.tasks.set(await this.tasksService.getTasksByTeam(this.teamId));
  }
}
