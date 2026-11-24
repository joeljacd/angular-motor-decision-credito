import { Injectable, signal } from '@angular/core';

export type ToastTone = 'success' | 'error' | 'info';
export interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

/** Notificaciones breves. this.toast.success('Guardado') — se renderizan en <ui-toast-host> (AppComponent). */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private seq = 0;
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  show(message: string, tone: ToastTone = 'success', durationMs = 3000): void {
    const id = ++this.seq;
    this._toasts.update((list) => [...list.slice(-2), { id, message, tone }]);
    if (durationMs > 0) setTimeout(() => this.dismiss(id), durationMs);
  }
  success(message: string): void { this.show(message, 'success'); }
  error(message: string): void { this.show(message, 'error', 5000); }
  info(message: string): void { this.show(message, 'info'); }

  dismiss(id: number): void {
    this._toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
