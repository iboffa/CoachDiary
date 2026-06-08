import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PlayService } from '../../../core/services/play.service';
import { PlayCategory, PlaySummary } from '../../../shared/models/models';

@Component({
  selector: 'app-play-list',
  imports: [DatePipe],
  templateUrl: './play-list.component.html',
  styleUrl: './play-list.component.scss',
})
export class PlayListComponent {
  private readonly playService = inject(PlayService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly teamId = PlayListComponent.parseId(this.route.snapshot.paramMap.get('teamId'));
  private readonly oppId  = PlayListComponent.parseId(this.route.snapshot.paramMap.get('oppId'));

  private static parseId(raw: string | null): number | null {
    if (!raw) return null;
    const n = parseInt(raw, 10);
    return isNaN(n) ? null : n;
  }

  private get filter() {
    if (this.oppId !== null) return { opponentId: this.oppId };
    if (this.teamId !== null) return { teamId: this.teamId };
    return undefined;
  }

  private get editorBasePath(): (string | number)[] {
    if (this.oppId !== null && this.teamId !== null) {
      return ['/teams', this.teamId, 'opponents', this.oppId, 'playbook'];
    }
    if (this.teamId !== null) {
      return ['/teams', this.teamId, 'playbook'];
    }
    return ['/playbook'];
  }

  readonly plays = signal<PlaySummary[]>([]);
  readonly templates = signal<PlaySummary[]>([]);
  readonly categories = signal<PlayCategory[]>([]);
  readonly collapsedFolders = signal<Set<number | null>>(new Set());
  readonly isEmpty = computed(() => this.plays().length === 0);

  readonly groupedPlays = computed(() => {
    const cats = this.categories();
    const plays = this.plays();
    const catMap = new Map(cats.map(c => [c.id!, c]));
    const byCategory = new Map<number, PlaySummary[]>();
    const uncategorized: PlaySummary[] = [];

    for (const play of plays) {
      if (play.category_id != null && catMap.has(play.category_id)) {
        const arr = byCategory.get(play.category_id) ?? [];
        arr.push(play);
        byCategory.set(play.category_id, arr);
      } else {
        uncategorized.push(play);
      }
    }

    const groups: { category: PlayCategory | null; plays: PlaySummary[] }[] = cats
      .filter(c => byCategory.has(c.id!))
      .map(c => ({ category: c, plays: byCategory.get(c.id!)! }));

    if (uncategorized.length > 0) groups.push({ category: null, plays: uncategorized });
    return groups;
  });

  constructor() {
    this.load();
  }

  private async load(): Promise<void> {
    const [plays, templates, categories] = await Promise.all([
      this.playService.list(this.filter),
      this.playService.listTemplates(this.filter),
      this.teamId !== null ? this.playService.listCategories(this.teamId) : Promise.resolve([]),
    ]);
    this.plays.set(plays);
    this.templates.set(templates);
    this.categories.set(categories);
  }

  toggleFolder(categoryId: number | null): void {
    this.collapsedFolders.update(s => {
      const next = new Set(s);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  }

  isFolderCollapsed(categoryId: number | null): boolean {
    return this.collapsedFolders().has(categoryId);
  }

  async deleteCategory(id: number, event: MouseEvent): Promise<void> {
    event.stopPropagation();
    if (!confirm('Delete this category? Plays will become uncategorized.')) return;
    await this.playService.deleteCategory(id);
    await this.load();
  }

  openEditor(id?: number): void {
    this.router.navigate([...this.editorBasePath, id ?? 'new']);
  }

  async duplicatePlay(id: number, event: MouseEvent): Promise<void> {
    event.stopPropagation();
    const play = await this.playService.get(id);
    if (!play) return;
    const { id: _id, created_at: _ca, updated_at: _ua, ...rest } = play;
    const newId = await this.playService.save({ ...rest, name: `Copy of ${play.name}`, is_template: false });
    this.router.navigate([...this.editorBasePath, newId]);
  }

  async savePlayAsTemplate(id: number, event: MouseEvent): Promise<void> {
    event.stopPropagation();
    const play = await this.playService.get(id);
    if (!play) return;
    const { id: _id, created_at: _ca, updated_at: _ua, ...rest } = play;
    await this.playService.save({ ...rest, is_template: true });
    await this.load();
  }

  async deletePlay(id: number, event: MouseEvent): Promise<void> {
    event.stopPropagation();
    if (confirm('Delete this play?')) {
      await this.playService.delete(id);
      await this.load();
    }
  }

  async useTemplate(templateId: number, event: MouseEvent): Promise<void> {
    event.stopPropagation();
    const template = await this.playService.get(templateId);
    if (!template) return;
    const { id: _id, created_at: _ca, updated_at: _ua, is_template: _it, ...rest } = template;
    const newId = await this.playService.save({ ...rest, is_template: false });
    this.router.navigate([...this.editorBasePath, newId]);
  }

  async deleteTemplate(id: number, event: MouseEvent): Promise<void> {
    event.stopPropagation();
    if (confirm('Delete this template?')) {
      await this.playService.delete(id);
      await this.load();
    }
  }

}
