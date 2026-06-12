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

  readonly teamId: number = (() => {
    const raw = this.route.snapshot.paramMap.get('teamId');
    return raw ? parseInt(raw, 10) : 0;
  })();

  private readonly gameIdRaw = this.route.snapshot.paramMap.get('gameId');
  readonly isNew = this.gameIdRaw === 'new' || this.gameIdRaw === null;
  private readonly gameId: number | null = this.isNew
    ? null
    : parseInt(this.gameIdRaw!, 10);

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

  private async load(id: number): Promise<void> {
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
        teamId: this.teamId,
        date: this.game.date ?? new Date().toISOString().split('T')[0],
        startTime: this.game.startTime ?? null,
        opponent: this.game.opponent.trim(),
        homeAway: this.game.homeAway ?? 'home',
        scoreUs: this.game.scoreUs ?? null,
        scoreThem: this.game.scoreThem ?? null,
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
      startTime: null,
      opponent: '',
      homeAway: 'home',
      scoreUs: null,
      scoreThem: null,
      notes: '',
    };
  }
}
