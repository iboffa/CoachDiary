import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GameService } from '../../../core/services/game.service';
import { Game } from '../../../shared/models/models';
import { TimePickerComponent } from '../../../shared/components/time-picker/time-picker.component';

@Component({
  selector: 'app-game-detail',
  imports: [FormsModule, TimePickerComponent],
  templateUrl: './game-detail.component.html',
  styleUrl: './game-detail.component.scss',
})
export class GameDetailComponent {
  private readonly service = inject(GameService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly teamId: string = (() => {
    const raw = this.route.snapshot.paramMap.get('teamId');
    return raw ?? '';
  })();

  private readonly gameIdRaw = this.route.snapshot.paramMap.get('gameId');
  readonly isNew = this.gameIdRaw === 'new' || this.gameIdRaw === null;
  private readonly gameId: string | null = this.isNew
    ? null
    : this.gameIdRaw!;

  readonly saving = signal(false);

  game: Partial<Game> = this.defaultGame();

  constructor() {
    if (!this.isNew && this.gameId !== null) {
      this.load(this.gameId);
      return;
    }
    const dateParam = this.route.snapshot.queryParamMap.get('date');
    if (dateParam) {
      this.game.date = dateParam;
    }
  }

  private async load(id: string): Promise<void> {
    const found = await this.service.getGame(id);
    if (found) {
      this.game = { ...found };
    }
  }

  async save(): Promise<void> {
    if (!this.game.opponent?.trim()) return;
    this.saving.set(true);
    try {
      const payload: Omit<Game, 'id'> = {
        team_id: this.teamId,
        date: this.game.date ?? new Date().toISOString().split('T')[0],
        start_time: this.game.start_time ?? null,
        opponent: this.game.opponent.trim(),
        home_away: this.game.home_away ?? 'home',
        score_us: this.game.score_us ?? null,
        score_them: this.game.score_them ?? null,
        notes: this.game.notes ?? '',
      };
      if (this.isNew) {
        await this.service.addGame(payload);
      } else {
        await this.service.updateGame(this.gameId!, payload);
      }
      this.back();
    } finally {
      this.saving.set(false);
    }
  }

  async deleteGame(): Promise<void> {
    if (!confirm('Delete this game?')) return;
    await this.service.deleteGame(this.gameId!);
    this.back();
  }

  back(): void {
    this.router.navigate(['/teams', this.teamId, 'games']);
  }

  private defaultGame(): Partial<Game> {
    return {
      date: new Date().toISOString().split('T')[0],
      start_time: null,
      opponent: '',
      home_away: 'home',
      score_us: null,
      score_them: null,
      notes: '',
    };
  }
}
