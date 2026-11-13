import { Injectable, signal } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'info';

export interface Notification {
  id: number;
  message: string;
  type: NotificationType;
  duration: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private readonly notificationsSignal = signal<Notification[]>([]);

  readonly notifications = this.notificationsSignal.asReadonly();

  private nextId = 0;

  showSuccess(message: string, duration = 3000): void {
    this.show(message, 'success', duration);
  }

  showError(message: string, duration = 5000): void {
    this.show(message, 'error', duration);
  }

  showInfo(message: string, duration = 3000): void {
    this.show(message, 'info', duration);
  }

  private show(
    message: string,
    type: NotificationType,
    duration: number
  ): void {
    const notification: Notification = {
      id: ++this.nextId,
      message,
      type,
      duration
    };

    this.notificationsSignal.update(items => [
      ...items,
      notification
    ]);
  }

  remove(id: number): void {
    this.notificationsSignal.update(items =>
      items.filter(item => item.id !== id)
    );
  }
}
