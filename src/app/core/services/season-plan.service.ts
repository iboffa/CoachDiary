import { Injectable } from '@angular/core';
import { DbService } from './db.service';
import { SeasonPlan } from '../../shared/models/models';

@Injectable({ providedIn: 'root' })
export class SeasonPlanService {
  constructor(private db: DbService) {}

  list(teamId?: number): Promise<SeasonPlan[]> {
    return this.db.listSeasonPlans(teamId);
  }

  get(id: number): Promise<SeasonPlan | undefined> {
    return this.db.getSeasonPlan(id);
  }

  save(plan: SeasonPlan): Promise<number> {
    return this.db.saveSeasonPlan(plan);
  }

  delete(id: number): Promise<void> {
    return this.db.deleteSeasonPlan(id);
  }
}
