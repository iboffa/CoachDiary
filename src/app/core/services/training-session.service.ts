import { Injectable } from '@angular/core';
import { DbService } from './db.service';
import { DrillCategory, SavedDrill, TrainingSession } from '../../shared/models/models';

@Injectable({ providedIn: 'root' })
export class TrainingSessionService {
  constructor(private db: DbService) {}

  list(teamId?: number): Promise<TrainingSession[]> {
    return this.db.listTrainingSessions(teamId);
  }

  listTemplates(teamId?: number): Promise<TrainingSession[]> {
    return this.db.listTrainingSessionTemplates(teamId);
  }

  get(id: number): Promise<TrainingSession | undefined> {
    return this.db.getTrainingSession(id);
  }

  save(session: TrainingSession): Promise<number> {
    return this.db.saveTrainingSession(session);
  }

  delete(id: number): Promise<void> {
    return this.db.deleteTrainingSession(id);
  }

  listSavedDrills(): Promise<SavedDrill[]> {
    return this.db.listSavedDrills();
  }

  saveSavedDrill(drill: SavedDrill): Promise<number> {
    return this.db.saveSavedDrill(drill);
  }

  deleteSavedDrill(id: number): Promise<void> {
    return this.db.deleteSavedDrill(id);
  }

  listDrillCategories(): Promise<DrillCategory[]> { return this.db.listDrillCategories(); }
  saveDrillCategory(cat: DrillCategory): Promise<number> { return this.db.saveDrillCategory(cat); }
  deleteDrillCategory(id: number): Promise<void> { return this.db.deleteDrillCategory(id); }
}
