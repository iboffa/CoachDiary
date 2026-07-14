import { Injectable } from '@angular/core';
import { DbService } from './db.service';
import { Task } from '../../shared/models/models';

@Injectable({ providedIn: 'root' })
export class TasksService {
  constructor(private db: DbService) {}

  getTasksByTeam(teamId: string): Promise<Task[]> { return this.db.listTasksByTeam(teamId); }
  getTasksByPlayer(teamId: string, playerId: string): Promise<Task[]> { return this.db.listTasksByPlayer(teamId, playerId); }
  addTask(task: Omit<Task, 'id'>): Promise<string> { return this.db.addTask(task); }
  updateTask(id: string, changes: Partial<Omit<Task, 'id'>>): Promise<void> { return this.db.updateTask(id, changes); }
  deleteTask(id: string): Promise<void> { return this.db.deleteTask(id); }
  toggleDone(id: string): Promise<void> { return this.db.toggleTaskDone(id); }
}
