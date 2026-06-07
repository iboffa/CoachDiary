import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { TeamService } from './core/services/team.service';
import { OpponentService } from './core/services/opponent.service';
import { Team, Opponent } from './shared/models/models';

type SidebarMode = 'teams' | 'team' | 'opponent';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly router = inject(Router);
  private readonly teamService = inject(TeamService);
  private readonly opponentService = inject(OpponentService);

  readonly sidebarMode = signal<SidebarMode>('teams');
  readonly currentTeamId = signal<number | null>(null);
  readonly currentOppId  = signal<number | null>(null);
  readonly currentTeam   = signal<Team | null>(null);
  readonly currentOpponent = signal<Opponent | null>(null);

  constructor() {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.syncSidebar(this.router.url));

    // Sync on first load
    this.syncSidebar(this.router.url);
  }

  private syncSidebar(url: string): void {
    const teamMatch = url.match(/\/teams\/(\d+)/);
    const oppMatch  = url.match(/\/opponents\/(\d+)/);

    if (oppMatch) {
      const oppId  = parseInt(oppMatch[1], 10);
      const teamId = teamMatch ? parseInt(teamMatch[1], 10) : null;
      this.sidebarMode.set('opponent');
      this.currentOppId.set(oppId);
      this.currentTeamId.set(teamId);
      this.opponentService.get(oppId).then(o => this.currentOpponent.set(o ?? null));
      if (teamId) this.teamService.get(teamId).then(t => this.currentTeam.set(t ?? null));
    } else if (teamMatch) {
      const teamId = parseInt(teamMatch[1], 10);
      this.sidebarMode.set('team');
      this.currentTeamId.set(teamId);
      this.currentOppId.set(null);
      this.currentOpponent.set(null);
      this.teamService.get(teamId).then(t => this.currentTeam.set(t ?? null));
    } else {
      this.sidebarMode.set('teams');
      this.currentTeamId.set(null);
      this.currentOppId.set(null);
      this.currentTeam.set(null);
      this.currentOpponent.set(null);
    }
  }

  backToTeams(): void {
    this.router.navigate(['/teams']);
  }

  backToOpponents(): void {
    this.router.navigate(['/teams', this.currentTeamId(), 'opponents']);
  }
}
