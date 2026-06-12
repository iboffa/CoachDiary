import { Injectable } from '@angular/core';
import { DbService } from './db.service';
import { Task } from '../../shared/models/models';

@Injectable({ providedIn: 'root' })
export class TasksService {
  constructor(private db: DbService) {}

  getTasksByTeam(teamId: number): Promise<Task[]> {
    return this.db.listTasksByTeam(teamId);
  }

  getTasksByPlayer(teamId: number, playerId: number): Promise<Task[]> {
    return this.db.listTasksByPlayer(teamId, playerId);
  }

  addTask(task: Omit<Task, 'id'>): Promise<number> {
    return this.db.addTask(task);
  }

  updateTask(id: number, changes: Partial<Omit<Task, 'id'>>): Promise<void> {
    return this.db.updateTask(id, changes);
  }

  deleteTask(id: number): Promise<void> {
    return this.db.deleteTask(id);
  }

  toggleDone(id: number): Promise<void> {
    return this.db.toggleTaskDone(id);
  }
}
