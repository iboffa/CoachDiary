import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SeasonPlanService } from '../../core/services/season-plan.service';
import { RecurringScheduleService } from '../calendar/recurring-schedule.service';
import { SeasonGoal, SeasonPlan, RecurringSchedule } from '../../shared/models/models';
import { TimePickerComponent } from '../../shared/components/time-picker/time-picker.component';

const DAY_ABBRS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

@Component({
  selector: 'app-season',
  imports: [FormsModule, DatePipe, TimePickerComponent],
  templateUrl: './season.component.html',
  styleUrl: './season.component.scss',
})
export class SeasonComponent {
  private readonly service = inject(SeasonPlanService);
  private readonly scheduleService = inject(RecurringScheduleService);
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

  // ── Weekly schedule state ─────────────────────────────────────
  readonly dayAbbrs = DAY_ABBRS;
  readonly scheduleSelectedDays = signal<number[]>([]);
  readonly scheduleStartTime = signal<string>('');
  readonly scheduleDuration = signal<number | null>(null);
  readonly scheduleSaving = signal(false);
  readonly scheduleTitle = signal<string>('Team Training');

  private existingScheduleId = signal<number | null>(null);

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
    this.loadScheduleForPlan(plan);
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
    this.resetScheduleState();
  }

  cancelEdit(): void {
    this.showForm.set(false);
    this.editingPlan = {};
    this.editingGoals.set([]);
    this.resetScheduleState();
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

  // ── Weekly schedule ───────────────────────────────────────────

  toggleScheduleDay(dayIndex: number): void {
    this.scheduleSelectedDays.update(days =>
      days.includes(dayIndex)
        ? days.filter(d => d !== dayIndex)
        : [...days, dayIndex].sort((a, b) => a - b),
    );
  }

  isScheduleDaySelected(dayIndex: number): boolean {
    return this.scheduleSelectedDays().includes(dayIndex);
  }

  setScheduleStartTime(time: string): void {
    this.scheduleStartTime.set(time);
  }

  async saveSchedule(): Promise<void> {
    if (!this.editingPlan.start_date || !this.editingPlan.end_date) return;
    if (this.teamId === null) return;

    this.scheduleSaving.set(true);
    try {
      const existingId = this.existingScheduleId();
      if (existingId !== null) {
        await this.scheduleService.delete(existingId);
        this.existingScheduleId.set(null);
      }

      if (this.scheduleSelectedDays().length > 0) {
        const newId = await this.scheduleService.add({
          teamId: this.teamId,
          title: this.scheduleTitle().trim() || 'Team Training',
          daysOfWeek: this.scheduleSelectedDays(),
          startTime: this.scheduleStartTime().trim() || null,
          durationMinutes: this.scheduleDuration(),
          startDate: this.editingPlan.start_date!,
          endDate: this.editingPlan.end_date!,
          active: true,
        });
        this.existingScheduleId.set(newId);
      }
    } finally {
      this.scheduleSaving.set(false);
    }
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

  private resetScheduleState(): void {
    this.scheduleSelectedDays.set([]);
    this.scheduleStartTime.set('');
    this.scheduleDuration.set(null);
    this.scheduleSaving.set(false);
    this.scheduleTitle.set('Team Training');
    this.existingScheduleId.set(null);
  }

  private async loadScheduleForPlan(plan: SeasonPlan): Promise<void> {
    this.resetScheduleState();
    if (this.teamId === null || !plan.start_date || !plan.end_date) return;

    const allSchedules = await this.scheduleService.list(this.teamId);
    const match = allSchedules.find(
      s => s.startDate === plan.start_date && s.endDate === plan.end_date,
    );

    if (match) {
      this.existingScheduleId.set(match.id ?? null);
      this.scheduleSelectedDays.set([...match.daysOfWeek]);
      this.scheduleStartTime.set(match.startTime ?? '');
      this.scheduleDuration.set(match.durationMinutes);
      if (match.title) this.scheduleTitle.set(match.title);
    }
  }
}
