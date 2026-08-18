import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SwRegistrationService {
  whenReady(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      return Promise.resolve(null);
    }
    return navigator.serviceWorker.ready.catch(() => null);
  }
}
