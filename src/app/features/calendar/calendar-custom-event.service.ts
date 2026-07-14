import { Injectable } from '@angular/core';
import { DbService } from '../../core/services/db.service';
import { CalendarCustomEvent } from '../../shared/models/models';

@Injectable({ providedIn: 'root' })
export class CalendarCustomEventService {
  constructor(private db: DbService) {}

  listByTeam(teamId: string): Promise<CalendarCustomEvent[]> { return this.db.listCalendarEvents(teamId); }
  create(event: Omit<CalendarCustomEvent, 'id'>): Promise<string> { return this.db.addCalendarEvent(event); }
  update(id: string, changes: Partial<CalendarCustomEvent>): Promise<void> { return this.db.updateCalendarEvent(id, changes); }
  delete(id: string): Promise<void> { return this.db.deleteCalendarEvent(id); }
}
