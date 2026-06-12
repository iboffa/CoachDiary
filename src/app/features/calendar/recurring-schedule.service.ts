import { Injectable } from '@angular/core';
import { DbService } from '../../core/services/db.service';
import { RecurringSchedule } from '../../shared/models/models';
import { CalendarEvent } from './calendar-event.model';

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Returns ISO weekday adjusted: Mon=0 … Sun=6  (matching RecurringSchedule.daysOfWeek)
function adjustedDow(d: Date): number {
  const dow = d.getDay(); // 0=Sun,1=Mon…6=Sat
  return dow === 0 ? 6 : dow - 1;
}

@Injectable({ providedIn: 'root' })
export class RecurringScheduleService {
  constructor(private db: DbService) {}

  list(teamId: number): Promise<RecurringSchedule[]> {
    return this.db.listRecurringSchedules(teamId);
  }

  add(s: Omit<RecurringSchedule, 'id'>): Promise<number> {
    return this.db.addRecurringSchedule(s);
  }

  update(id: number, changes: Partial<RecurringSchedule>): Promise<void> {
    return this.db.updateRecurringSchedule(id, changes);
  }

  delete(id: number): Promise<void> {
    return this.db.deleteRecurringSchedule(id);
  }

  expandToEvents(
    schedules: RecurringSchedule[],
    teamId: number,
    fromDate: Date,
    toDate: Date,
  ): CalendarEvent[] {
    const events: CalendarEvent[] = [];

    for (const schedule of schedules) {
      if (!schedule.active) continue;

      const schedStart = new Date(schedule.startDate + 'T00:00:00');
      const schedEnd = new Date(schedule.endDate + 'T00:00:00');

      const windowStart = schedStart > fromDate ? schedStart : fromDate;
      const windowEnd = schedEnd < toDate ? schedEnd : toDate;

      if (windowStart > windowEnd) continue;

      const cursor = new Date(windowStart);
      cursor.setHours(0, 0, 0, 0);

      while (cursor <= windowEnd) {
        if (schedule.daysOfWeek.includes(adjustedDow(cursor))) {
          const dateStr = toIsoDate(cursor);
          events.push({
            id: `recurring-${schedule.id}-${dateStr}`,
            date: new Date(cursor),
            title: schedule.title,
            type: 'training',
            startTime: schedule.startTime,
            durationMinutes: schedule.durationMinutes,
            routerLink: null,
            isRecurring: true,
            recurringScheduleId: schedule.id,
            recurringDate: dateStr,
          });
        }
        cursor.setDate(cursor.getDate() + 1);
      }
    }

    return events;
  }
}
