import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { TeamService } from './core/services/team.service';
import { OpponentService } from './core/services/opponent.service';
import { AuthService } from './core/services/auth.service';
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
  private readonly auth = inject(AuthService);

  readonly sidebarMode = signal<SidebarMode>('teams');
  readonly currentTeamId = signal<string | null>(null);
  readonly currentOppId  = signal<string | null>(null);
  readonly currentTeam   = signal<Team | null>(null);
  readonly currentOpponent = signal<Opponent | null>(null);

  readonly session = toSignal(this.auth.session$, { initialValue: this.auth.session });
  readonly userEmail = () => this.session()?.user.email ?? '';
  readonly userMenuOpen = signal(false);

  readonly currentUrl = signal(this.router.url);
  readonly isLoginRoute = computed(() => this.currentUrl().startsWith('/login'));
  readonly sidebarOpen = signal(false);

  constructor() {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        this.currentUrl.set(this.router.url);
        this.syncSidebar(this.router.url);
        this.sidebarOpen.set(false);
      });

    // Sync on first load
    this.syncSidebar(this.router.url);
  }

  toggleSidebar(event: MouseEvent): void {
    event.stopPropagation();
    this.sidebarOpen.update(open => !open);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  @HostListener('document:click')
  closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }

  toggleUserMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.userMenuOpen.update(open => !open);
  }

  openSettings(): void {
    this.userMenuOpen.set(false);
    this.router.navigate(['/settings']);
  }

  async logout(): Promise<void> {
    this.userMenuOpen.set(false);
    await this.auth.signOut();
  }

  private syncSidebar(url: string): void {
    const teamMatch = url.match(/\/teams\/([^\/]+)/);
    const oppMatch  = url.match(/\/opponents\/([^\/]+)/);

    if (oppMatch) {
      const oppId  = oppMatch[1];
      const teamId = teamMatch ? teamMatch[1] : null;
      this.sidebarMode.set('opponent');
      this.currentOppId.set(oppId);
      this.currentTeamId.set(teamId);
      this.opponentService.get(oppId).then(o => this.currentOpponent.set(o ?? null));
      if (teamId) this.teamService.get(teamId).then(t => this.currentTeam.set(t ?? null));
    } else if (teamMatch) {
      const teamId = teamMatch[1];
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
