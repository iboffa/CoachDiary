import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TeamService } from '../../../core/services/team.service';
import { Team, TeamNote } from '../../../shared/models/models';

@Component({
  selector: 'app-team-notes',
  imports: [FormsModule, DatePipe],
  templateUrl: './team-notes.component.html',
  styleUrl: './team-notes.component.scss',
})
export class TeamNotesComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly teamService = inject(TeamService);

  readonly teamId = this.route.snapshot.paramMap.get('teamId') ?? '';

  team = signal<Team | null>(null);
  entries = signal<TeamNote[]>([]);

  newEntry: Partial<TeamNote> = this.freshEntry();

  constructor() {
    this.load();
  }

  private async load(): Promise<void> {
    const [team, entries] = await Promise.all([
      this.teamService.get(this.teamId),
      this.teamService.listNotes(this.teamId),
    ]);
    this.team.set(team ?? null);
    this.entries.set(entries);
  }

  async addEntry(): Promise<void> {
    if (!this.newEntry.content?.trim()) return;
    await this.teamService.saveNote({ ...this.newEntry, team_id: this.teamId } as TeamNote);
    this.newEntry = this.freshEntry();
    this.entries.set(await this.teamService.listNotes(this.teamId));
  }

  async deleteEntry(id: string): Promise<void> {
    await this.teamService.deleteNote(id);
    this.entries.set(await this.teamService.listNotes(this.teamId));
  }

  private freshEntry(): Partial<TeamNote> {
    return { date: new Date().toISOString().split('T')[0], content: '' };
  }
}
