import { Injectable } from '@angular/core';
import { DbService } from '../../core/services/db.service';
import { CalendarCustomEvent } from '../../shared/models/models';

@Injectable({ providedIn: 'root' })
export class CalendarCustomEventService {
  constructor(private db: DbService) {}

  listByTeam(teamId: number): Promise<CalendarCustomEvent[]> {
    return this.db.listCalendarEvents(teamId);
  }

  create(event: Omit<CalendarCustomEvent, 'id'>): Promise<number> {
    return this.db.addCalendarEvent(event);
  }

  update(id: number, changes: Partial<CalendarCustomEvent>): Promise<void> {
    return this.db.updateCalendarEvent(id, changes);
  }

  delete(id: number): Promise<void> {
    return this.db.deleteCalendarEvent(id);
  }
}
