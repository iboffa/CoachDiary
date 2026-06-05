import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TitleCasePipe } from '@angular/common';
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

  readonly players        = signal<Player[]>([]);
  readonly selectedPlayer = signal<Player | null>(null);
  readonly notes          = signal<PlayerNote[]>([]);
  readonly showForm       = signal(false);

  readonly hasSelection   = computed(() => this.selectedPlayer() !== null);
  readonly isEmpty        = computed(() => this.players().length === 0);

  readonly positions      = ['PG', 'SG', 'SF', 'PF', 'C'] as const;
  readonly noteCategories = ['general', 'technical', 'physical', 'mental', 'game'] as const;

  // Plain objects for form binding — signals would require verbose template plumbing with ngModel
  editingPlayer: Partial<Player> = {};
  newNote: Partial<PlayerNote> = this.freshNote();

  constructor() {
    this.loadPlayers();
  }

  private async loadPlayers(): Promise<void> {
    this.players.set(await this.playerService.list());
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
    await this.playerService.save(this.editingPlayer as Player);
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
