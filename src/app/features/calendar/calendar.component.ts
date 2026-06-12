import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
  HostListener,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CalendarService } from './calendar.service';
import { CalendarCustomEventService } from './calendar-custom-event.service';
import { CalendarEvent, CalendarEventType } from './calendar-event.model';
import { CalendarCustomEventType } from '../../shared/models/models';
import { TimePickerComponent } from '../../shared/components/time-picker/time-picker.component';

export type ViewMode = 'month' | 'week';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

interface InlineForm {
  date: Date;
  type: CalendarCustomEventType;
  title: string;
  startTime: string;
  durationMinutes: number | null;
  notes: string;
  saving: boolean;
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [RouterLink, DatePipe, FormsModule, TimePickerComponent],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss',
})
export class CalendarComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly calendarService = inject(CalendarService);
  private readonly customEventService = inject(CalendarCustomEventService);

  readonly teamId: number = (() => {
    const raw = this.route.snapshot.paramMap.get('teamId');
    return raw ? parseInt(raw, 10) : 0;
  })();

  readonly year = signal<number>(new Date().getFullYear());
  readonly month = signal<number>(new Date().getMonth());

  readonly weekAnchor = signal<Date>((() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  })());

  readonly viewMode = signal<ViewMode>('month');

  readonly allEvents = signal<CalendarEvent[]>([]);
  readonly selectedDay = signal<Date | null>(null);

  readonly popoverDay = signal<Date | null>(null);
  readonly popoverPosition = signal<{ top: number; left: number } | null>(null);

  readonly inlineForm = signal<InlineForm | null>(null);

  readonly headerLabel = computed(() => {
    if (this.viewMode() === 'month') {
      return new Date(this.year(), this.month(), 1)
        .toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    const week = this.weekDaysForAnchor();
    if (week.length === 0) return '';
    const first = week[0].date;
    const last = week[6].date;
    const sameMonth = first.getMonth() === last.getMonth();
    const sameYear = first.getFullYear() === last.getFullYear();
    const startStr = first.toLocaleDateString('en-US', {
      day: 'numeric',
      ...(sameMonth ? {} : { month: 'short' }),
      ...(!sameYear ? { year: 'numeric' } : {}),
    });
    const endStr = last.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    return `${startStr}–${endStr}`;
  });

  readonly days = computed<CalendarDay[]>(() => {
    if (this.viewMode() === 'week') {
      return this.weekDaysForAnchor();
    }
    return this.monthGrid();
  });

  readonly selectedDayEvents = computed<CalendarEvent[]>(() => {
    const sel = this.selectedDay();
    if (!sel) return [];
    return this.eventsForDay(sel);
  });

  readonly weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  readonly customEventTypeLabels: Record<CalendarCustomEventType, string> = {
    'meeting': 'Meeting',
    'video-session': 'Video Session',
    'tournament': 'Tournament',
    'other': 'Other',
  };

  ngOnInit(): void {
    this.loadEvents();
  }

  private loadEvents(): void {
    this.calendarService.getEventsForTeam(this.teamId).subscribe(events => {
      this.allEvents.set(events);
    });
  }

  // ── Navigation ────────────────────────────────────────────────

  prev(): void {
    if (this.viewMode() === 'week') {
      this.weekAnchor.update(d => {
        const next = new Date(d);
        next.setDate(next.getDate() - 7);
        return next;
      });
    } else {
      if (this.month() === 0) {
        this.month.set(11);
        this.year.update(y => y - 1);
      } else {
        this.month.update(m => m - 1);
      }
      this.selectedDay.set(null);
    }
    this.popoverDay.set(null);
    this.inlineForm.set(null);
    this.popoverPosition.set(null);
  }

  next(): void {
    if (this.viewMode() === 'week') {
      this.weekAnchor.update(d => {
        const next = new Date(d);
        next.setDate(next.getDate() + 7);
        return next;
      });
    } else {
      if (this.month() === 11) {
        this.month.set(0);
        this.year.update(y => y + 1);
      } else {
        this.month.update(m => m + 1);
      }
      this.selectedDay.set(null);
    }
    this.popoverDay.set(null);
    this.inlineForm.set(null);
    this.popoverPosition.set(null);
  }

  setViewMode(mode: ViewMode): void {
    this.viewMode.set(mode);
    this.popoverDay.set(null);
    this.inlineForm.set(null);
    this.popoverPosition.set(null);
    if (mode === 'week') {
      const sel = this.selectedDay();
      if (sel) {
        this.weekAnchor.set(new Date(sel));
      } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        this.weekAnchor.set(today);
      }
    }
  }

  // ── Day selection ─────────────────────────────────────────────

  selectDay(day: CalendarDay): void {
    const sel = this.selectedDay();
    if (sel && sel.getTime() === day.date.getTime()) {
      this.selectedDay.set(null);
    } else {
      this.selectedDay.set(day.date);
    }
  }

  // ── Add-event popover ─────────────────────────────────────────

  openPopover(day: CalendarDay, event: MouseEvent): void {
    event.stopPropagation();
    const current = this.popoverDay();
    const isThisDay = current !== null && current.getTime() === day.date.getTime();
    if (isThisDay) {
      this.popoverDay.set(null);
      this.inlineForm.set(null);
      this.popoverPosition.set(null);
    } else {
      const btn = event.currentTarget as HTMLElement;
      const rect = btn.getBoundingClientRect();
      const popoverWidth = 170;
      const left = Math.max(8, rect.right - popoverWidth);
      this.popoverDay.set(day.date);
      this.inlineForm.set(null);
      this.popoverPosition.set({ top: rect.bottom + 4, left });
    }
  }

  isPopoverOpen(day: CalendarDay): boolean {
    const p = this.popoverDay();
    return p !== null && p.getTime() === day.date.getTime() && this.inlineForm() === null;
  }

  isInlineFormOpen(day: CalendarDay): boolean {
    const form = this.inlineForm();
    if (!form) return false;
    return form.date.getTime() === day.date.getTime();
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.popoverDay.set(null);
    this.inlineForm.set(null);
    this.popoverPosition.set(null);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.popoverDay.set(null);
    this.inlineForm.set(null);
    this.popoverPosition.set(null);
  }

  navigateToCreate(type: 'training' | 'game', date: Date): void {
    this.popoverDay.set(null);
    this.inlineForm.set(null);
    const iso = date.toISOString().split('T')[0];
    if (type === 'game') {
      this.router.navigate(['/teams', this.teamId, 'games', 'new'], {
        queryParams: { date: iso },
      });
    } else {
      this.router.navigate(['/teams', this.teamId, 'training'], {
        queryParams: { date: iso },
      });
    }
  }

  openInlineForm(type: CalendarCustomEventType, date: Date, event: MouseEvent): void {
    event.stopPropagation();
    this.inlineForm.set({
      date,
      type,
      title: '',
      startTime: '',
      durationMinutes: null,
      notes: '',
      saving: false,
    });
  }

  setInlineStartTime(time: string): void {
    this.inlineForm.update(f => f ? { ...f, startTime: time } : null);
  }

  cancelInlineForm(event: MouseEvent): void {
    event.stopPropagation();
    this.inlineForm.set(null);
    this.popoverDay.set(null);
    this.popoverPosition.set(null);
  }

  async saveInlineForm(event: MouseEvent): Promise<void> {
    event.stopPropagation();
    const form = this.inlineForm();
    if (!form || !form.title.trim()) return;

    this.inlineForm.update(f => f ? { ...f, saving: true } : null);

    const iso = form.date.toISOString().split('T')[0];
    await this.customEventService.create({
      teamId: this.teamId,
      title: form.title.trim(),
      date: iso,
      startTime: form.startTime.trim() || null,
      durationMinutes: form.durationMinutes,
      type: form.type,
      notes: form.notes.trim() || undefined,
    });

    this.inlineForm.set(null);
    this.popoverDay.set(null);
    this.popoverPosition.set(null);
    this.loadEvents();
  }

  async deleteCustomEvent(customEventId: number, event: MouseEvent): Promise<void> {
    event.stopPropagation();
    event.preventDefault();
    await this.customEventService.delete(customEventId);
    this.loadEvents();
  }

  // ── Promote recurring event to session ────────────────────────

  promoteToSession(event: CalendarEvent, mouseEvent: MouseEvent): void {
    mouseEvent.stopPropagation();
    mouseEvent.preventDefault();
    const date = event.recurringDate ?? event.date.toISOString().split('T')[0];
    this.router.navigate(['/teams', this.teamId, 'training'], {
      queryParams: { date },
    });
  }

  // ── Chip helpers ──────────────────────────────────────────────

  chipLabel(ev: CalendarEvent): string {
    const prefix = ev.isRecurring ? '↻ ' : '';
    if (ev.startTime) {
      return `${prefix}${ev.startTime} ${ev.title}`;
    }
    return `${prefix}${ev.title}`;
  }

  visibleChips(events: CalendarEvent[]): CalendarEvent[] {
    if (this.viewMode() === 'week') return events;
    return events.slice(0, 3);
  }

  overflowCount(events: CalendarEvent[]): number {
    if (this.viewMode() === 'week') return 0;
    return Math.max(0, events.length - 3);
  }

  dayLabel(date: Date): string {
    return String(date.getDate());
  }

  typeLabel(type: CalendarEventType): string {
    const labels: Record<CalendarEventType, string> = {
      'game': 'Game',
      'training': 'Training',
      'meeting': 'Meeting',
      'video-session': 'Video Session',
      'tournament': 'Tournament',
      'other': 'Other',
      'season-goal': 'Season Goal',
      'journal': 'Journal',
      'task': 'Task',
    };
    return labels[type] ?? type;
  }

  timeDurationLabel(ev: CalendarEvent): string {
    const parts: string[] = [];
    if (ev.startTime) parts.push(ev.startTime);
    if (ev.durationMinutes) parts.push(`${ev.durationMinutes} min`);
    return parts.join(' · ');
  }

  // ── Private grid builders ─────────────────────────────────────

  private monthGrid(): CalendarDay[] {
    const y = this.year();
    const m = this.month();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstOfMonth = new Date(y, m, 1);
    let startDow = firstOfMonth.getDay();
    startDow = startDow === 0 ? 6 : startDow - 1;

    const lastOfMonth = new Date(y, m + 1, 0);
    let endDow = lastOfMonth.getDay();
    endDow = endDow === 0 ? 6 : endDow - 1;

    const gridStart = new Date(firstOfMonth);
    gridStart.setDate(gridStart.getDate() - startDow);

    const gridEnd = new Date(lastOfMonth);
    if (endDow < 6) {
      gridEnd.setDate(gridEnd.getDate() + (6 - endDow));
    }

    const days: CalendarDay[] = [];
    const cursor = new Date(gridStart);

    while (cursor <= gridEnd) {
      const dayDate = new Date(cursor);
      dayDate.setHours(0, 0, 0, 0);

      days.push({
        date: dayDate,
        isCurrentMonth: dayDate.getMonth() === m,
        isToday: dayDate.getTime() === today.getTime(),
        events: this.eventsForDay(dayDate),
      });

      cursor.setDate(cursor.getDate() + 1);
    }

    return days;
  }

  private weekDaysForAnchor(): CalendarDay[] {
    const anchor = this.weekAnchor();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dow = anchor.getDay();
    const distToMon = dow === 0 ? -6 : 1 - dow;
    const monday = new Date(anchor);
    monday.setDate(monday.getDate() + distToMon);
    monday.setHours(0, 0, 0, 0);

    const days: CalendarDay[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push({
        date: d,
        isCurrentMonth: true,
        isToday: d.getTime() === today.getTime(),
        events: this.eventsForDay(d),
      });
    }
    return days;
  }

  private eventsForDay(date: Date): CalendarEvent[] {
    return this.allEvents().filter(e => {
      const d = new Date(e.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === date.getTime();
    });
  }
}
