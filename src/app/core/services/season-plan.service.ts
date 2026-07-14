import { Injectable } from '@angular/core';
import { DbService } from './db.service';
import { SeasonPlan } from '../../shared/models/models';

@Injectable({ providedIn: 'root' })
export class SeasonPlanService {
  constructor(private db: DbService) {}

  list(teamId?: string): Promise<SeasonPlan[]> { return this.db.listSeasonPlans(teamId); }
  get(id: string): Promise<SeasonPlan | undefined> { return this.db.getSeasonPlan(id); }
  save(plan: SeasonPlan): Promise<string> { return this.db.saveSeasonPlan(plan); }
  delete(id: string): Promise<void> { return this.db.deleteSeasonPlan(id); }
}
