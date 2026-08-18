import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/timer-screen/timer-screen.component').then((m) => m.TimerScreenComponent),
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings.component').then((m) => m.SettingsComponent),
  },
  {
    path: 'history',
    loadComponent: () => import('./features/history/history.component').then((m) => m.HistoryComponent),
  },
  {
    path: 'library',
    loadComponent: () =>
      import('./features/exercise-library/exercise-library.component').then((m) => m.ExerciseLibraryComponent),
  },
  { path: '**', redirectTo: '' },
];
