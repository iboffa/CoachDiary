import { Injectable } from '@angular/core';
import { DbService } from './db.service';
import { Team, TeamNote } from '../../shared/models/models';

@Injectable({ providedIn: 'root' })
export class TeamService {
  constructor(private db: DbService) {}

  list(): Promise<Team[]> { return this.db.listTeams(); }
  get(id: number): Promise<Team | undefined> { return this.db.getTeam(id); }
  save(team: Team): Promise<number> { return this.db.saveTeam(team); }
  delete(id: number): Promise<void> { return this.db.deleteTeam(id); }

  listNotes(teamId: number): Promise<TeamNote[]> { return this.db.listTeamNotes(teamId); }
  saveNote(note: TeamNote): Promise<number> { return this.db.saveTeamNote(note); }
  deleteNote(id: number): Promise<void> { return this.db.deleteTeamNote(id); }
}
