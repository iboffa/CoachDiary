import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TeamService } from '../../core/services/team.service';
import { Team } from '../../shared/models/models';

@Component({
  selector: 'app-teams',
  imports: [FormsModule],
  templateUrl: './teams.component.html',
  styleUrl: './teams.component.scss',
})
export class TeamsComponent {
  private readonly teamService = inject(TeamService);
  private readonly router = inject(Router);

  readonly teams = signal<Team[]>([]);
  readonly showForm = signal(false);
  readonly isEmpty = computed(() => this.teams().length === 0);
  readonly formError = signal<string | null>(null);

  editingTeam: Partial<Team> = {};

  constructor() {
    this.load();
  }

  private async load(): Promise<void> {
    this.teams.set(await this.teamService.list());
  }

  openTeam(id: string): void {
    this.router.navigate(['/teams', id, 'playbook']);
  }

  openTraining(id: string): void {
    this.router.navigate(['/teams', id, 'training']);
  }

  openNewForm(): void {
    this.editingTeam = {};
    this.formError.set(null);
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
  }

  async saveTeam(): Promise<void> {
    if (!this.editingTeam.name?.trim()) return;
    this.formError.set(null);
    try {
      await this.teamService.save(this.editingTeam as Team);
      this.showForm.set(false);
      await this.load();
    } catch (err) {
      console.error('[Teams] Failed to save team:', err);
      this.formError.set(err instanceof Error ? err.message : 'Could not save the team. Please try again.');
    }
  }

  async deleteTeam(id: string, event: MouseEvent): Promise<void> {
    event.stopPropagation();
    if (!confirm('Delete this team? All associated data will remain but be unlinked.')) return;
    await this.teamService.delete(id);
    await this.load();
  }
}
