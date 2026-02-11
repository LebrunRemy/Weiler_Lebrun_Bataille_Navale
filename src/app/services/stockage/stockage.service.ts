import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ServiceStockage {
  private store = signal<Record<string, unknown>>({});

  getString(key: string, fallback = ''): string {
    const value = this.store()[key];
    return typeof value === 'string' ? value : fallback;
  }

  getBoolean(key: string, fallback = false): boolean {
    const value = this.store()[key];
    return typeof value === 'boolean' ? value : fallback;
  }

  getNumber(key: string, fallback = 0): number {
    const value = this.store()[key];
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  }

  setString(key: string, value: string) {
    this.store.update(current => ({ ...current, [key]: value }));
  }

  setBoolean(key: string, value: boolean) {
    this.store.update(current => ({ ...current, [key]: value }));
  }

  setNumber(key: string, value: number) {
    this.store.update(current => ({ ...current, [key]: value }));
  }
}
