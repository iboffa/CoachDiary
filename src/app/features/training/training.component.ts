import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TrainingSessionService } from '../../core/services/training-session.service';
import { Drill, DrillCategory, SavedDrill, TrainingSession } from '../../shared/models/models';
import { DrillPreviewComponent } from './drill-preview.component';
import { TimePickerComponent } from '../../shared/components/time-picker/time-picker.component';

@Component({
  selector: 'app-training',
  imports: [FormsModule, DatePipe, DrillPreviewComponent, TimePickerComponent],
  templateUrl: './training.component.html',
  styleUrl: './training.component.scss',
})
export class TrainingComponent {
  private readonly service = inject(TrainingSessionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly teamId: number | null = (() => {
    const raw = this.route.snapshot.paramMap.get('teamId');
    if (!raw) return null;
    const n = parseInt(raw, 10);
    return isNaN(n) ? null : n;
  })();

  readonly sessions         = signal<TrainingSession[]>([]);
  readonly templates        = signal<TrainingSession[]>([]);
  readonly savedDrills      = signal<SavedDrill[]>([]);
  readonly drillCategories  = signal<DrillCategory[]>([]);
  readonly showForm         = signal(false);
  readonly isNew            = signal(false);
  readonly saving           = signal(false);
  readonly editingDrills    = signal<Drill[]>([]);
  readonly showLibrary      = signal(false);
  readonly dragIndex        = signal<number | null>(null);
  readonly dragOverIndex    = signal<number | null>(null);
  readonly scheduledMinutes = signal<number | undefined>(undefined);
  readonly collapsedDrillFolders = signal<Set<number | null>>(new Set());
  newDrillCategoryName = '';

  readonly isEmpty = computed(() => this.sessions().length === 0);

  readonly groupedSavedDrills = computed(() => {
    const cats = this.drillCategories();
    const drills = this.savedDrills();
    const catMap = new Map(cats.map(c => [c.id!, c]));
    const byCategory = new Map<number, SavedDrill[]>();
    const uncategorized: SavedDrill[] = [];

    for (const drill of drills) {
      if (drill.category_id !== undefined && catMap.has(drill.category_id)) {
        const arr = byCategory.get(drill.category_id) ?? [];
        arr.push(drill);
        byCategory.set(drill.category_id, arr);
      } else {
        uncategorized.push(drill);
      }
    }

    const groups: { category: DrillCategory | null; drills: SavedDrill[] }[] = cats
      .filter(c => byCategory.has(c.id!))
      .map(c => ({ category: c, drills: byCategory.get(c.id!)! }));

    if (uncategorized.length > 0) groups.push({ category: null, drills: uncategorized });
    return groups;
  });

  readonly totalDrillMinutes = computed(() =>
    this.editingDrills().reduce((sum, d) => sum + (d.duration_minutes || 0), 0),
  );

  readonly durationStatus = computed(() => {
    const total = this.totalDrillMinutes();
    const scheduled = this.scheduledMinutes();
    if (!scheduled) return null;
    const diff = total - scheduled;
    return {
      total, scheduled, diff,
      state: diff > 0 ? 'over' as const : diff > -10 ? 'tight' as const : 'ok' as const,
    };
  });

  editingSession: Partial<TrainingSession> = {};

  constructor() {
    this.load();
    this.loadSavedDrills();
    this.loadDrillCategories();
  }

  private async load(): Promise<void> {
    const [sessions, templates] = await Promise.all([
      this.service.list(this.teamId ?? undefined),
      this.service.listTemplates(this.teamId ?? undefined),
    ]);
    this.sessions.set(sessions);
    this.templates.set(templates);

    const returnSessionId = this.route.snapshot.queryParamMap.get('session');
    if (returnSessionId) {
      const id = parseInt(returnSessionId, 10);
      const session = sessions.find(s => s.id === id) ?? templates.find(s => s.id === id);
      if (session) this.selectSession(session);
      return;
    }

    const dateParam = this.route.snapshot.queryParamMap.get('date');
    if (dateParam) {
      this.newSession();
      this.editingSession.date = dateParam;
    }
  }

  private async loadSavedDrills(): Promise<void> {
    this.savedDrills.set(await this.service.listSavedDrills());
  }

  selectSession(session: TrainingSession): void {
    this.editingSession = { ...session };
    this.editingDrills.set(this.parseDrills(session.drills));
    this.scheduledMinutes.set(session.duration_minutes ?? undefined);
    this.isNew.set(false);
    this.showForm.set(true);
    this.showLibrary.set(false);
  }

  newSession(): void {
    this.editingSession = {
      name: '',
      date: new Date().toISOString().split('T')[0],
      duration_minutes: 90,
      focus: '',
      notes: '',
    };
    this.editingDrills.set([]);
    this.scheduledMinutes.set(90);
    this.isNew.set(true);
    this.showForm.set(true);
    this.showLibrary.set(false);
  }

  onScheduledMinutesChange(value: number): void {
    this.editingSession.duration_minutes = value || undefined;
    this.scheduledMinutes.set(value > 0 ? value : undefined);
  }

  cancelEdit(): void {
    this.showForm.set(false);
    this.editingDrills.set([]);
    this.editingSession = {};
    this.scheduledMinutes.set(undefined);
    this.showLibrary.set(false);
  }

  async save(): Promise<void> {
    if (!this.editingSession.name?.trim()) return;
    this.saving.set(true);
    try {
      const session: TrainingSession = {
        ...(this.editingSession as TrainingSession),
        team_id: this.teamId ?? undefined,
        drills: JSON.stringify(this.editingDrills()),
      };
      const id = await this.service.save(session);
      await this.load();
      const saved = this.sessions().find(s => s.id === id)
        ?? this.templates().find(s => s.id === id);
      if (saved) this.editingSession = { ...saved };
      this.isNew.set(false);
    } finally {
      this.saving.set(false);
    }
  }

  async deleteSession(id: number, event: Event): Promise<void> {
    event.stopPropagation();
    if (!confirm('Delete this training session?')) return;
    await this.service.delete(id);
    if (this.editingSession.id === id) this.cancelEdit();
    await this.load();
  }

  // ── Templates ─────────────────────────────────────────────────

  async saveAsTemplate(session: TrainingSession, event: Event): Promise<void> {
    event.stopPropagation();
    const { id: _id, created_at: _ca, updated_at: _ua, ...rest } = session;
    await this.service.save({ ...rest, is_template: true });
    await this.load();
  }

  async useTemplate(template: TrainingSession, event: Event): Promise<void> {
    event.stopPropagation();
    const { id: _id, created_at: _ca, updated_at: _ua, is_template: _it, ...rest } = template;
    const newId = await this.service.save({
      ...rest,
      team_id: this.teamId ?? undefined,
      date: new Date().toISOString().split('T')[0],
      is_template: false,
    });
    await this.load();
    const created = this.sessions().find(s => s.id === newId);
    if (created) this.selectSession(created);
  }

  async deleteTemplate(id: number, event: Event): Promise<void> {
    event.stopPropagation();
    if (!confirm('Delete this template?')) return;
    await this.service.delete(id);
    if (this.editingSession.id === id) this.cancelEdit();
    await this.load();
  }

  // ── Drills ────────────────────────────────────────────────────

  addDrill(): void {
    this.editingDrills.update(drills => [
      ...drills,
      { id: crypto.randomUUID(), name: '', duration_minutes: 15, description: '' },
    ]);
  }

  removeDrill(drillId: string): void {
    this.editingDrills.update(drills => drills.filter(d => d.id !== drillId));
  }

  moveDrillUp(index: number): void {
    if (index === 0) return;
    this.editingDrills.update(drills => {
      const arr = [...drills];
      [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
      return arr;
    });
  }

  moveDrillDown(index: number): void {
    this.editingDrills.update(drills => {
      if (index >= drills.length - 1) return drills;
      const arr = [...drills];
      [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
      return arr;
    });
  }

  onDrillDragStart(index: number): void {
    this.dragIndex.set(index);
  }

  onDrillDragOver(index: number, event: DragEvent): void {
    event.preventDefault();
    if (this.dragIndex() !== null) this.dragOverIndex.set(index);
  }

  onDrillDrop(targetIndex: number, event: DragEvent): void {
    event.preventDefault();
    const from = this.dragIndex();
    if (from !== null && from !== targetIndex) {
      this.editingDrills.update(drills => {
        const arr = [...drills];
        const [moved] = arr.splice(from, 1);
        arr.splice(targetIndex, 0, moved);
        return arr;
      });
    }
    this.dragIndex.set(null);
    this.dragOverIndex.set(null);
  }

  onDrillDragEnd(): void {
    this.dragIndex.set(null);
    this.dragOverIndex.set(null);
  }

  updateDrill(drillId: string, field: keyof Drill, value: string | number): void {
    this.editingDrills.update(drills =>
      drills.map(d => d.id === drillId ? { ...d, [field]: value } : d),
    );
  }

  // ── Drill library ─────────────────────────────────────────────

  isDrillSaved(name: string): boolean {
    if (!name.trim()) return false;
    return this.savedDrills().some(
      sd => sd.name.trim().toLowerCase() === name.trim().toLowerCase(),
    );
  }

  async saveToLibrary(drill: Drill): Promise<void> {
    if (!drill.name.trim()) return;
    const existing = this.savedDrills().find(
      sd => sd.name.trim().toLowerCase() === drill.name.trim().toLowerCase(),
    );
    await this.service.saveSavedDrill({
      ...(existing ?? {}),
      name: drill.name.trim(),
      duration_minutes: drill.duration_minutes,
      description: drill.description,
    });
    await this.loadSavedDrills();
  }

  addFromLibrary(savedDrill: SavedDrill): void {
    this.editingDrills.update(drills => [
      ...drills,
      {
        id: crypto.randomUUID(),
        name: savedDrill.name,
        duration_minutes: savedDrill.duration_minutes,
        description: savedDrill.description ?? '',
      },
    ]);
  }

  async removeFromLibrary(id: number, event: Event): Promise<void> {
    event.stopPropagation();
    await this.service.deleteSavedDrill(id);
    await this.loadSavedDrills();
  }

  async setDrillCategory(drill: SavedDrill, categoryId: number | undefined): Promise<void> {
    await this.service.saveSavedDrill({ ...drill, category_id: categoryId });
    await this.loadSavedDrills();
  }

  // ── Helpers ───────────────────────────────────────────────────

  drillsInfo(session: TrainingSession): { count: number; minutes: number } {
    try {
      const drills: Drill[] = JSON.parse(session.drills || '[]');
      return {
        count: drills.length,
        minutes: drills.reduce((s, d) => s + (d.duration_minutes || 0), 0),
      };
    } catch {
      return { count: 0, minutes: 0 };
    }
  }

  formatDuration(minutes: number | undefined): string {
    if (!minutes) return '';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`;
  }

  // ── Drill categories ──────────────────────────────────────────

  private async loadDrillCategories(): Promise<void> {
    this.drillCategories.set(await this.service.listDrillCategories());
  }

  async createDrillCategory(): Promise<void> {
    const name = this.newDrillCategoryName.trim();
    if (!name) return;
    await this.service.saveDrillCategory({ name });
    this.newDrillCategoryName = '';
    await this.loadDrillCategories();
  }

  async deleteDrillCategory(id: number, event: Event): Promise<void> {
    event.stopPropagation();
    if (!confirm('Delete this category? Drills will become uncategorized.')) return;
    await this.service.deleteDrillCategory(id);
    await this.loadDrillCategories();
    await this.loadSavedDrills();
  }

  toggleDrillFolder(categoryId: number | null): void {
    this.collapsedDrillFolders.update(s => {
      const next = new Set(s);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  }

  isDrillFolderCollapsed(categoryId: number | null): boolean {
    return this.collapsedDrillFolders().has(categoryId);
  }

  private parseDrills(json: string): Drill[] {
    try { return JSON.parse(json) || []; } catch { return []; }
  }

  openExercise(sessionId: number, drillId: string): void {
    this.router.navigate(['/teams', this.teamId, 'training', sessionId, 'drill', drillId]);
  }

  back(): void {
    if (this.teamId) {
      this.router.navigate(['/teams', this.teamId, 'playbook']);
    } else {
      this.router.navigate(['/teams']);
    }
  }
}
