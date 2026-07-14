import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { PlayerService } from '../../core/services/player.service';
import { TasksService } from '../../core/services/tasks.service';
import { Player, PlayerNote, PlayerRole, Task } from '../../shared/models/models';

@Component({
  selector: 'app-players',
  imports: [FormsModule, TitleCasePipe, DatePipe],
  templateUrl: './players.component.html',
  styleUrl: './players.component.scss',
})
export class PlayersComponent {
  private readonly playerService = inject(PlayerService);
  private readonly tasksService = inject(TasksService);
  private readonly route = inject(ActivatedRoute);

  private readonly teamId: string | null = (() => {
    const raw = this.route.snapshot.paramMap.get('teamId');
    return raw ?? null;
  })();

  readonly players        = signal<Player[]>([]);
  readonly selectedPlayer = signal<Player | null>(null);
  readonly notes          = signal<PlayerNote[]>([]);
  readonly playerTasks    = signal<Task[]>([]);
  readonly showForm       = signal(false);
  readonly tasksExpanded  = signal(false);

  readonly hasSelection   = computed(() => this.selectedPlayer() !== null);
  readonly isEmpty        = computed(() => this.players().length === 0);

  readonly positions      = ['PG', 'SG', 'SF', 'PF', 'C'] as const;
  readonly noteCategories = ['general', 'technical', 'physical', 'mental', 'game'] as const;
  readonly roles: { value: PlayerRole; label: string }[] = [
    { value: 'star',       label: '★ Star'       },
    { value: 'starter',    label: 'Starter'       },
    { value: 'bench',      label: 'Bench'         },
    { value: 'deep_bench', label: 'Deep Bench'    },
  ];

  readonly today = new Date().toISOString().split('T')[0];

  editingPlayer: Partial<Player> = {};
  newNote: Partial<PlayerNote> = this.freshNote();
  newTaskTitle = '';
  newTaskDueDate = '';

  constructor() {
    this.loadPlayers();
  }

  private async loadPlayers(): Promise<void> {
    this.players.set(await this.playerService.list(this.teamId ?? undefined));
  }

  async selectPlayer(player: Player): Promise<void> {
    this.selectedPlayer.set(player);
    this.tasksExpanded.set(false);
    const [notes, tasks] = await Promise.all([
      this.playerService.listNotes(player.id!),
      this.tasksService.getTasksByPlayer(this.teamId ?? '', player.id!),
    ]);
    this.notes.set(notes);
    this.playerTasks.set(tasks);
  }

  openNewForm(): void {
    this.editingPlayer = { dominant_hand: 'right' };
    this.showForm.set(true);
  }

  openEditForm(player: Player): void {
    this.editingPlayer = { ...player };
    this.showForm.set(true);
  }

  async savePlayer(): Promise<void> {
    const player: Player = {
      ...this.editingPlayer as Player,
      team_id: this.teamId ?? undefined,
    };
    await this.playerService.save(player);
    this.showForm.set(false);
    await this.loadPlayers();
  }

  async deletePlayer(id: string): Promise<void> {
    if (!confirm('Delete this player?')) return;
    await this.playerService.delete(id);
    if (this.selectedPlayer()?.id === id) this.selectedPlayer.set(null);
    await this.loadPlayers();
  }

  async saveNote(): Promise<void> {
    const player = this.selectedPlayer();
    if (!player) return;
    await this.playerService.saveNote({ ...this.newNote, player_id: player.id! } as PlayerNote);
    this.newNote = this.freshNote();
    this.notes.set(await this.playerService.listNotes(player.id!));
  }

  async deleteNote(id: string): Promise<void> {
    await this.playerService.deleteNote(id);
    const player = this.selectedPlayer();
    if (player) this.notes.set(await this.playerService.listNotes(player.id!));
  }

  async addPlayerTask(): Promise<void> {
    const player = this.selectedPlayer();
    if (!player || !this.newTaskTitle.trim()) return;
    await this.tasksService.addTask({
      team_id: this.teamId ?? '',
      title: this.newTaskTitle.trim(),
      due_date: this.newTaskDueDate || undefined,
      done: false,
      player_id: player.id!,
      created_at: new Date().toISOString(),
    });
    this.newTaskTitle = '';
    this.newTaskDueDate = '';
    this.playerTasks.set(
      await this.tasksService.getTasksByPlayer(this.teamId ?? '', player.id!),
    );
  }

  async togglePlayerTask(task: Task): Promise<void> {
    const player = this.selectedPlayer();
    if (!player) return;
    await this.tasksService.toggleDone(task.id!);
    this.playerTasks.set(
      await this.tasksService.getTasksByPlayer(this.teamId ?? '', player.id!),
    );
  }

  async deletePlayerTask(id: string): Promise<void> {
    const player = this.selectedPlayer();
    if (!player) return;
    await this.tasksService.deleteTask(id);
    this.playerTasks.set(
      await this.tasksService.getTasksByPlayer(this.teamId ?? '', player.id!),
    );
  }

  private freshNote(): Partial<PlayerNote> {
    return { category: 'general', date: new Date().toISOString().split('T')[0] };
  }
}
