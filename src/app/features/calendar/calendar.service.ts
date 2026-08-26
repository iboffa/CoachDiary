import { Injectable } from '@angular/core';
import { from, forkJoin, Observable, map } from 'rxjs';
import { GameService } from '../../core/services/game.service';
import { TrainingSessionService } from '../../core/services/training-session.service';
import { CalendarCustomEventService } from './calendar-custom-event.service';
import { SeasonPlanService } from '../../core/services/season-plan.service';
import { TeamService } from '../../core/services/team.service';
import { RecurringScheduleService } from './recurring-schedule.service';
import { TasksService } from '../../core/services/tasks.service';
import { CalendarEvent } from './calendar-event.model';
import { SeasonGoal } from '../../shared/models/models';

@Injectable({ providedIn: 'root' })
export class CalendarService {
  constructor(
    private gameService: GameService,
    private trainingService: TrainingSessionService,
    private customEventService: CalendarCustomEventService,
    private seasonPlanService: SeasonPlanService,
    private teamService: TeamService,
    private recurringScheduleService: RecurringScheduleService,
    private tasksService: TasksService,
  ) {}

  getEventsForTeam(teamId: string): Observable<CalendarEvent[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const windowFrom = new Date(today);
    windowFrom.setMonth(windowFrom.getMonth() - 3);
    const windowTo = new Date(today);
    windowTo.setMonth(windowTo.getMonth() + 3);

    return forkJoin({
      games: from(this.gameService.getGamesByTeam(teamId)),
      trainings: from(this.trainingService.list(teamId)),
      customs: from(this.customEventService.listByTeam(teamId)),
      seasonPlans: from(this.seasonPlanService.list(teamId)),
      notes: from(this.teamService.listNotes(teamId)),
      schedules: from(this.recurringScheduleService.list(teamId)),
      tasks: from(this.tasksService.getTasksByTeam(teamId)),
    }).pipe(
      map(({ games, trainings, customs, seasonPlans, notes, schedules, tasks }) => {
        const events: CalendarEvent[] = [];

        for (const game of games) {
          events.push({
            id: `game-${game.id}`,
            date: new Date(game.date),
            title: game.opponent,
            type: 'game',
            start_time: game.start_time ?? null,
            duration_minutes: 120,
            routerLink: ['/teams', teamId, 'games', String(game.id)],
          });
        }

        for (const session of trainings) {
          if (!session.date) continue;
          events.push({
            id: `training-${session.id}`,
            date: new Date(session.date),
            title: session.name,
            type: 'training',
            start_time: session.start_time ?? null,
            duration_minutes: session.duration_minutes ?? null,
            routerLink: ['/teams', teamId, 'training'],
          });
        }

        for (const custom of customs) {
          events.push({
            id: `custom-${custom.id}`,
            date: new Date(custom.date),
            title: custom.title,
            type: custom.type,
            start_time: custom.start_time,
            duration_minutes: custom.duration_minutes,
            routerLink: null,
            customEventId: custom.id,
          });
        }

        for (const plan of seasonPlans) {
          if (!plan.goals) continue;
          let goals: SeasonGoal[];
          try {
            goals = JSON.parse(plan.goals);
          } catch {
            continue;
          }
          for (const goal of goals) {
            if (!goal.deadline) continue;
            events.push({
              id: `season-goal-${goal.id}`,
              date: new Date(goal.deadline),
              title: goal.text,
              type: 'season-goal',
              start_time: null,
              duration_minutes: null,
              routerLink: ['/teams', teamId, 'season'],
            });
          }
        }

        for (const note of notes) {
          events.push({
            id: `journal-${note.id}`,
            date: new Date(note.date),
            title: note.content.slice(0, 60),
            type: 'journal',
            start_time: null,
            duration_minutes: null,
            routerLink: ['/teams', teamId, 'notes'],
          });
        }

        const realTrainingDates = new Set<string>(
          trainings.filter(s => !!s.date).map(s => s.date as string),
        );

        const recurringEvents = this.recurringScheduleService.expandToEvents(
          schedules, teamId, windowFrom, windowTo,
        );

        for (const recurring of recurringEvents) {
          if (recurring.recurringDate && realTrainingDates.has(recurring.recurringDate)) continue;
          events.push(recurring);
        }

        for (const task of tasks) {
          if (!task.due_date) continue;
          events.push({
            id: `task-${task.id}`,
            date: new Date(task.due_date),
            title: task.title,
            type: 'task',
            start_time: null,
            duration_minutes: null,
            routerLink: ['/teams', teamId, 'tasks'],
          });
        }

        return events;
      }),
    );
  }
}
