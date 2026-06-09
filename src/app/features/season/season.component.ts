import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SeasonPlanService } from '../../core/services/season-plan.service';
import { SeasonGoal, SeasonPlan } from '../../shared/models/models';

@Component({
  selector: 'app-season',
  imports: [FormsModule, DatePipe],
  templateUrl: './season.component.html',
  styleUrl: './season.component.scss',
})
export class SeasonComponent {
  private readonly service = inject(SeasonPlanService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly teamId: number | null = (() => {
    const raw = this.route.snapshot.paramMap.get('teamId');
    if (!raw) return null;
    const n = parseInt(raw, 10);
    return isNaN(n) ? null : n;
  })();

  readonly plans    = signal<SeasonPlan[]>([]);
  readonly showForm = signal(false);
  readonly isNew    = signal(false);
  readonly saving   = signal(false);

  readonly isEmpty  = computed(() => this.plans().length === 0);

  readonly editingGoals = signal<SeasonGoal[]>([]);

  editingPlan: Partial<SeasonPlan> = {};

  constructor() {
    this.load();
  }

  async load(): Promise<void> {
    this.plans.set(await this.service.list(this.teamId ?? undefined));
  }

  selectPlan(plan: SeasonPlan): void {
    this.editingPlan = { ...plan };
    this.editingGoals.set(this.parseGoals(plan.goals));
    this.isNew.set(false);
    this.showForm.set(true);
  }

  newPlan(): void {
    const year = new Date().getFullYear();
    this.editingPlan = {
      name: '',
      season_year: `${year}-${year + 1}`,
      start_date: `${year}-09-01`,
      end_date:   `${year + 1}-06-30`,
    };
    this.editingGoals.set([]);
    this.isNew.set(true);
    this.showForm.set(true);
  }

  cancelEdit(): void {
    this.showForm.set(false);
    this.editingPlan = {};
    this.editingGoals.set([]);
  }

  async save(): Promise<void> {
    if (!this.editingPlan.name?.trim()) return;
    this.saving.set(true);
    try {
      const plan: SeasonPlan = {
        ...(this.editingPlan as SeasonPlan),
        team_id: this.teamId ?? undefined,
        goals: JSON.stringify(this.editingGoals()),
      };
      const id = await this.service.save(plan);
      await this.load();
      const saved = this.plans().find(p => p.id === id);
      if (saved) {
        this.editingPlan = { ...saved };
        this.editingGoals.set(this.parseGoals(saved.goals));
      }
      this.isNew.set(false);
    } finally {
      this.saving.set(false);
    }
  }

  async deletePlan(id: number, event: Event): Promise<void> {
    event.stopPropagation();
    if (!confirm('Delete this season plan?')) return;
    await this.service.delete(id);
    if (this.editingPlan.id === id) this.cancelEdit();
    await this.load();
  }

  // ── Goals ─────────────────────────────────────────────────────

  addGoal(): void {
    this.editingGoals.update(goals => [
      ...goals,
      { id: crypto.randomUUID(), text: '', done: false },
    ]);
  }

  removeGoal(id: string): void {
    this.editingGoals.update(goals => goals.filter(g => g.id !== id));
  }

  toggleGoal(id: string): void {
    this.editingGoals.update(goals =>
      goals.map(g => g.id === id ? { ...g, done: !g.done } : g),
    );
  }

  updateGoalText(id: string, text: string): void {
    this.editingGoals.update(goals =>
      goals.map(g => g.id === id ? { ...g, text } : g),
    );
  }

  updateGoalDeadline(id: string, deadline: string): void {
    this.editingGoals.update(goals =>
      goals.map(g => g.id === id ? { ...g, deadline: deadline || undefined } : g),
    );
  }

  // ── Sidebar helpers ───────────────────────────────────────────

  goalCount(plan: SeasonPlan): number {
    return this.parseGoals(plan.goals).length;
  }

  doneCount(plan: SeasonPlan): number {
    return this.parseGoals(plan.goals).filter(g => g.done).length;
  }

  // ── Navigation ────────────────────────────────────────────────

  back(): void {
    this.router.navigate(['/teams']);
  }

  // ── Private ───────────────────────────────────────────────────

  private parseGoals(json?: string): SeasonGoal[] {
    try {
      const parsed = JSON.parse(json ?? '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  }
}
