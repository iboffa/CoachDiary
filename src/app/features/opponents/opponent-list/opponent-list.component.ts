import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { OpponentService } from '../../../core/services/opponent.service';
import { Opponent } from '../../../shared/models/models';

@Component({
  selector: 'app-opponent-list',
  imports: [FormsModule],
  templateUrl: './opponent-list.component.html',
  styleUrl: './opponent-list.component.scss',
})
export class OpponentListComponent {
  private readonly opponentService = inject(OpponentService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly teamId = parseInt(this.route.snapshot.paramMap.get('teamId')!, 10);
  readonly opponents = signal<Opponent[]>([]);
  readonly showForm = signal(false);
  readonly isEmpty = computed(() => this.opponents().length === 0);

  editingOpponent: Partial<Opponent> = {};

  constructor() {
    this.load();
  }

  private async load(): Promise<void> {
    this.opponents.set(await this.opponentService.list(this.teamId));
  }

  openOpponent(id: number): void {
    this.router.navigate(['/teams', this.teamId, 'opponents', id]);
  }

  openNewForm(): void {
    this.editingOpponent = {};
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
  }

  async saveOpponent(): Promise<void> {
    if (!this.editingOpponent.name?.trim()) return;
    await this.opponentService.save({ ...this.editingOpponent, team_id: this.teamId } as Opponent);
    this.showForm.set(false);
    await this.load();
  }

  async deleteOpponent(id: number, event: MouseEvent): Promise<void> {
    event.stopPropagation();
    if (!confirm('Delete this opponent?')) return;
    await this.opponentService.delete(id);
    await this.load();
  }
}
