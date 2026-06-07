import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TitleCasePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { PlayerService } from '../../core/services/player.service';
import { Player, PlayerNote } from '../../shared/models/models';

@Component({
  selector: 'app-players',
  imports: [FormsModule, TitleCasePipe],
  templateUrl: './players.component.html',
  styleUrl: './players.component.scss',
})
export class PlayersComponent {
  private readonly playerService = inject(PlayerService);
  private readonly route = inject(ActivatedRoute);

  private readonly teamId: number | null = (() => {
    const raw = this.route.snapshot.paramMap.get('teamId');
    if (!raw) return null;
    const n = parseInt(raw, 10);
    return isNaN(n) ? null : n;
  })();

  readonly players        = signal<Player[]>([]);
  readonly selectedPlayer = signal<Player | null>(null);
  readonly notes          = signal<PlayerNote[]>([]);
  readonly showForm       = signal(false);

  readonly hasSelection   = computed(() => this.selectedPlayer() !== null);
  readonly isEmpty        = computed(() => this.players().length === 0);

  readonly positions      = ['PG', 'SG', 'SF', 'PF', 'C'] as const;
  readonly noteCategories = ['general', 'technical', 'physical', 'mental', 'game'] as const;

  editingPlayer: Partial<Player> = {};
  newNote: Partial<PlayerNote> = this.freshNote();

  constructor() {
    this.loadPlayers();
  }

  private async loadPlayers(): Promise<void> {
    this.players.set(await this.playerService.list(this.teamId ?? undefined));
  }

  async selectPlayer(player: Player): Promise<void> {
    this.selectedPlayer.set(player);
    this.notes.set(await this.playerService.listNotes(player.id!));
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

  async deletePlayer(id: number): Promise<void> {
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

  async deleteNote(id: number): Promise<void> {
    await this.playerService.deleteNote(id);
    const player = this.selectedPlayer();
    if (player) this.notes.set(await this.playerService.listNotes(player.id!));
  }

  private freshNote(): Partial<PlayerNote> {
    return { category: 'general', date: new Date().toISOString().split('T')[0] };
  }
}
