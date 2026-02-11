import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ServiceStockage {
  private store = signal<Record<string, string>>({});

  getString(key: string, fallback = ''): string {
    const value = this.store()[key];
    return value ?? fallback;
  }

  getBoolean(key: string, fallback = false): boolean {
    const value = this.store()[key];
    if (value == null) return fallback;
    return value === 'true';
  }

  getNumber(key: string, fallback = 0): number {
    const value = this.store()[key];
    if (value == null) return fallback;
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  setString(key: string, value: string) {
    this.store.update(current => ({ ...current, [key]: value }));
  }

  setBoolean(key: string, value: boolean) {
    this.store.update(current => ({ ...current, [key]: String(value) }));
  }

  setNumber(key: string, value: number) {
    this.store.update(current => ({ ...current, [key]: String(value) }));
  }
}
