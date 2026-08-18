import { Injectable, inject } from '@angular/core';
import { DbService } from './db.service';
import { SessionEntry } from '../../shared/models/session-entry.model';

@Injectable({ providedIn: 'root' })
export class SessionHistoryRepository {
  private db = inject(DbService);

  async add(entry: SessionEntry): Promise<void> {
    await this.db.sessionHistory.add(entry);
  }

  async getSince(timestamp: number): Promise<SessionEntry[]> {
    return this.db.sessionHistory.where('timestamp').aboveOrEqual(timestamp).toArray();
  }

  async getAll(): Promise<SessionEntry[]> {
    return this.db.sessionHistory.orderBy('timestamp').toArray();
  }
}
