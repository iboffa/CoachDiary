import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { OpponentService } from '../../../core/services/opponent.service';
import { Opponent, OpponentNote, OpponentPlayer } from '../../../shared/models/models';

type Tab = 'notes' | 'roster';

@Component({
  selector: 'app-opponent-detail',
  imports: [FormsModule, DatePipe],
  templateUrl: './opponent-detail.component.html',
  styleUrl: './opponent-detail.component.scss',
})
export class OpponentDetailComponent {
  private readonly opponentService = inject(OpponentService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly teamId = this.route.snapshot.paramMap.get('teamId') ?? '';
  readonly oppId  = this.route.snapshot.paramMap.get('oppId') ?? '';

  readonly opponent = signal<Opponent | null>(null);
  readonly notes    = signal<OpponentNote[]>([]);
  readonly players  = signal<OpponentPlayer[]>([]);

  readonly activeTab    = signal<Tab>('notes');
  readonly showPlayerForm = signal(false);

  readonly positions = ['PG', 'SG', 'SF', 'PF', 'C'] as const;

  newNote: Partial<OpponentNote> = this.freshNote();
  editingPlayer: Partial<OpponentPlayer> = {};

  constructor() {
    this.load();
  }

  private async load(): Promise<void> {
    const [opp, notes, players] = await Promise.all([
      this.opponentService.get(this.oppId),
      this.opponentService.listNotes(this.oppId),
      this.opponentService.listPlayers(this.oppId),
    ]);
    this.opponent.set(opp ?? null);
    this.notes.set(notes);
    this.players.set(players);
  }

  setTab(tab: Tab): void {
    this.activeTab.set(tab);
  }

  goToPlaybook(): void {
    this.router.navigate(['/teams', this.teamId, 'opponents', this.oppId, 'playbook']);
  }

  async addNote(): Promise<void> {
    if (!this.newNote.content?.trim()) return;
    await this.opponentService.saveNote({ ...this.newNote, opponent_id: this.oppId } as OpponentNote);
    this.newNote = this.freshNote();
    this.notes.set(await this.opponentService.listNotes(this.oppId));
  }

  async deleteNote(id: string): Promise<void> {
    await this.opponentService.deleteNote(id);
    this.notes.set(await this.opponentService.listNotes(this.oppId));
  }

  openPlayerForm(): void {
    this.editingPlayer = { position: '' };
    this.showPlayerForm.set(true);
  }

  closePlayerForm(): void {
    this.showPlayerForm.set(false);
  }

  async savePlayer(): Promise<void> {
    if (!this.editingPlayer.name?.trim()) return;
    await this.opponentService.savePlayer({ ...this.editingPlayer, opponent_id: this.oppId } as OpponentPlayer);
    this.showPlayerForm.set(false);
    this.players.set(await this.opponentService.listPlayers(this.oppId));
  }

  async deletePlayer(id: string): Promise<void> {
    if (!confirm('Remove this player?')) return;
    await this.opponentService.deletePlayer(id);
    this.players.set(await this.opponentService.listPlayers(this.oppId));
  }

  private freshNote(): Partial<OpponentNote> {
    return { date: new Date().toISOString().split('T')[0] };
  }
}
