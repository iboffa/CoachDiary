import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { PlayService } from '../../../core/services/play.service';
import { PlaySummary } from '../../../shared/models/models';

@Component({
  selector: 'app-play-list',
  imports: [DatePipe],
  templateUrl: './play-list.component.html',
  styleUrl: './play-list.component.scss',
})
export class PlayListComponent {
  private readonly playService = inject(PlayService);
  private readonly router = inject(Router);

  readonly plays = signal<PlaySummary[]>([]);
  readonly isEmpty = computed(() => this.plays().length === 0);

  constructor() {
    this.load();
  }

  private async load(): Promise<void> {
    this.plays.set(await this.playService.list());
  }

  openEditor(id?: number): void {
    this.router.navigate(['/playbook', id ?? 'new']);
  }

  async deletePlay(id: number, event: MouseEvent): Promise<void> {
    event.stopPropagation();
    if (confirm('Delete this play?')) {
      await this.playService.delete(id);
      await this.load();
    }
  }

  categoryClass(cat: string): string {
    return `badge badge--${cat}`;
  }
}
