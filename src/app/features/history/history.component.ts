import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { SessionHistoryRepository } from '../../core/persistence/session-history.repository';
import { SessionEntry } from '../../shared/models/session-entry.model';
import { StatCardComponent } from '../../shared/ui/stat-card/stat-card.component';
import { breaksOnDay, computeStreak, formatMinutes, totalBreakSecondsOnDay } from '../../shared/util/stats.util';

interface HeatCell {
  date: Date;
  level: number;
  breaks: number;
  seconds: number;
}

interface WeekBar {
  label: string;
  date: Date;
  breaks: number;
  seconds: number;
  heightPct: number;
}

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [StatCardComponent],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss',
})
export class HistoryComponent implements OnInit {
  private readonly history = inject(SessionHistoryRepository);

  protected readonly sessions = signal<SessionEntry[]>([]);

  protected readonly breaksToday = computed(() => breaksOnDay(this.sessions(), new Date()).length);
  protected readonly breaksThisWeek = computed(() => this.countInLastDays(7));
  protected readonly streak = computed(() => computeStreak(this.sessions()));
  protected readonly stretchThisWeekLabel = computed(() => formatMinutes(this.secondsInLastDays(7)));

  protected readonly heatWeeks = computed(() => this.buildHeatWeeks());
  protected readonly weekBars = computed(() => this.buildWeekBars());
  protected readonly bestDayLabel = computed(() => this.buildBestDayLabel());

  ngOnInit(): void {
    void this.history.getAll().then((sessions) => this.sessions.set(sessions));
  }

  private countInLastDays(days: number): number {
    let count = 0;
    const cursor = new Date();
    for (let i = 0; i < days; i++) {
      count += breaksOnDay(this.sessions(), cursor).length;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  }

  private secondsInLastDays(days: number): number {
    let total = 0;
    const cursor = new Date();
    for (let i = 0; i < days; i++) {
      total += totalBreakSecondsOnDay(this.sessions(), cursor);
      cursor.setDate(cursor.getDate() - 1);
    }
    return total;
  }

  private buildHeatWeeks(): HeatCell[][] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days: HeatCell[] = [];
    for (let i = 83; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const breaks = breaksOnDay(this.sessions(), d).length;
      const seconds = totalBreakSecondsOnDay(this.sessions(), d);
      days.push({ date: d, level: heatLevel(breaks), breaks, seconds });
    }
    const weeks: HeatCell[][] = [];
    for (let w = 0; w < 12; w++) {
      weeks.push(days.slice(w * 7, w * 7 + 7));
    }
    return weeks;
  }

  private buildWeekBars(): WeekBar[] {
    const today = new Date();
    const days: { label: string; date: Date; breaks: number; seconds: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push({
        label: dayLabel(d),
        date: d,
        breaks: breaksOnDay(this.sessions(), d).length,
        seconds: totalBreakSecondsOnDay(this.sessions(), d),
      });
    }
    const max = Math.max(1, ...days.map((d) => d.seconds));
    return days.map((d) => ({
      label: d.label,
      date: d.date,
      breaks: d.breaks,
      seconds: d.seconds,
      heightPct: d.seconds === 0 ? 4 : Math.max(6, Math.round((d.seconds / max) * 100)),
    }));
  }

  protected dayTooltip(date: Date, breaks: number, seconds: number): string {
    const dateLabel = date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    if (breaks === 0) return `${dateLabel} · no breaks`;
    const breakWord = breaks === 1 ? 'break' : 'breaks';
    return `${dateLabel} · ${breaks} ${breakWord} · ${formatMinutes(seconds)}`;
  }

  private buildBestDayLabel(): string {
    const bars = this.weekBars();
    if (bars.every((b) => b.seconds === 0)) return 'No stretching logged yet this week';
    const best = bars.reduce((a, b) => (b.seconds > a.seconds ? b : a));
    return `Best day: ${best.label} · ${formatMinutes(best.seconds)}`;
  }
}

function heatLevel(count: number): number {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  return 3;
}

function dayLabel(d: Date): string {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
}
