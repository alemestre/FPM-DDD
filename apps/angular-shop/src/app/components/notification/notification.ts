import { Component, inject } from '@angular/core';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { NotificationService } from './notification.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [NgbToastModule],
  templateUrl: './notification.html'
})
export class NotificationComponent {

  readonly notificationService = inject(NotificationService);

  get notifications() {
    return this.notificationService.notifications;
  }

  removeNotification(id: number): void {
    this.notificationService.remove(id);
  }
}
