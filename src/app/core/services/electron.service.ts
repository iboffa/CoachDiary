import { Injectable } from '@angular/core';

declare global {
  interface Window {
    electronAPI?: {
      invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
    };
  }
}

@Injectable({ providedIn: 'root' })
export class ElectronService {
  readonly isElectron = typeof window !== 'undefined' && !!window.electronAPI;

  invoke<T>(channel: string, ...args: unknown[]): Promise<T> {
    if (!this.isElectron) {
      return Promise.reject(new Error('Not running in Electron'));
    }
    return window.electronAPI!.invoke(channel, ...args) as Promise<T>;
  }
}
