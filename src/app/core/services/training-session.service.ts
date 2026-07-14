import { Injectable } from '@angular/core';
import { DbService } from './db.service';
import { DrillCategory, SavedDrill, TrainingSession } from '../../shared/models/models';

@Injectable({ providedIn: 'root' })
export class TrainingSessionService {
  constructor(private db: DbService) {}

  list(teamId?: string): Promise<TrainingSession[]> { return this.db.listTrainingSessions(teamId); }
  listTemplates(teamId?: string): Promise<TrainingSession[]> { return this.db.listTrainingSessionTemplates(teamId); }
  get(id: string): Promise<TrainingSession | undefined> { return this.db.getTrainingSession(id); }
  save(session: TrainingSession): Promise<string> { return this.db.saveTrainingSession(session); }
  delete(id: string): Promise<void> { return this.db.deleteTrainingSession(id); }

  listSavedDrills(): Promise<SavedDrill[]> { return this.db.listSavedDrills(); }
  saveSavedDrill(drill: SavedDrill): Promise<string> { return this.db.saveSavedDrill(drill); }
  deleteSavedDrill(id: string): Promise<void> { return this.db.deleteSavedDrill(id); }

  listDrillCategories(): Promise<DrillCategory[]> { return this.db.listDrillCategories(); }
  saveDrillCategory(cat: DrillCategory): Promise<string> { return this.db.saveDrillCategory(cat); }
  deleteDrillCategory(id: string): Promise<void> { return this.db.deleteDrillCategory(id); }
}
