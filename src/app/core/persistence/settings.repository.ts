import { Injectable, inject, signal } from '@angular/core';
import { DbService } from './db.service';
import { DEFAULT_SETTINGS, UserSettings } from '../../shared/models/settings.model';

@Injectable({ providedIn: 'root' })
export class SettingsRepository {
  private db = inject(DbService);

  readonly settings = signal<UserSettings>(DEFAULT_SETTINGS);
  private loadPromise?: Promise<UserSettings>;

  constructor() {
    this.load();
  }

  load(): Promise<UserSettings> {
    if (!this.loadPromise) {
      this.loadPromise = this.doLoad();
    }
    return this.loadPromise;
  }

  private async doLoad(): Promise<UserSettings> {
    await this.db.ensureSeeded();
    const stored = await this.db.settings.get('singleton');
    const value = stored ?? DEFAULT_SETTINGS;
    this.settings.set(value);
    return value;
  }

  async update(patch: Partial<UserSettings>): Promise<void> {
    const next: UserSettings = { ...this.settings(), ...patch, id: 'singleton' };
    this.settings.set(next);
    await this.db.settings.put(next);
  }
}
