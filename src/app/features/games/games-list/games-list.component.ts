import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { GameService } from '../../../core/services/game.service';
import { Game } from '../../../shared/models/models';

@Component({
  selector: 'app-games-list',
  imports: [DatePipe],
  templateUrl: './games-list.component.html',
  styleUrl: './games-list.component.scss',
})
export class GamesListComponent {
  private readonly service = inject(GameService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly teamId: string = (() => {
    const raw = this.route.snapshot.paramMap.get('teamId');
    return raw ?? '';
  })();

  readonly games = signal<Game[]>([]);
  readonly isEmpty = computed(() => this.games().length === 0);

  constructor() {
    this.load();
  }

  async load(): Promise<void> {
    this.games.set(await this.service.getGamesByTeam(this.teamId));
  }

  addGame(): void {
    this.router.navigate(['/teams', this.teamId, 'games', 'new']);
  }

  openGame(id: string): void {
    this.router.navigate(['/teams', this.teamId, 'games', id]);
  }

  score(game: Game): string {
    if (game.score_us === null || game.score_them === null) return 'TBD';
    return `${game.score_us} - ${game.score_them}`;
  }

  back(): void {
    this.router.navigate(['/teams', this.teamId, 'playbook']);
  }
}
