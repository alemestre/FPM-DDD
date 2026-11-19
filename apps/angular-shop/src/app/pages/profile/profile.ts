import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CustomerInformation } from './customer-information/customer-information';
import { NotificationService } from '../../services/notification.service';
import { Order, OrderStatus } from '../../models/entities/order';
import { ProfileService } from '../../services/profile.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { RouterLink } from '@angular/router';
import { TopBar } from './top-card/top-bar';
import { catchError, EMPTY } from 'rxjs';

type ProfileTab = 'informations' | 'commandes';

const CURRENT_STATUSES: readonly OrderStatus[] = ['REGISTERED', 'IN_PROGRESS', 'MODIFIED', 'READY'];

/** Plus récentes en premier. */
const byNewest = (a: Order, b: Order) => b.createdAt.localeCompare(a.createdAt);

@Component({
    selector: 'app-profile',
  imports: [RouterLink, DatePipe, NgTemplateOutlet, NgbNavModule, TopBar, CustomerInformation],
    templateUrl: './profile.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Profile {
    private readonly profileService = inject(ProfileService);

    private readonly notificationService = inject(NotificationService);

    /** Lu dans ProfileService : mis à jour au chargement et après chaque enregistrement du profil. */
    profile = this.profileService.profile;

    constructor() {
        this.profileService
            .getProfile()
            .pipe(
                catchError(() => {
                    this.notificationService.showError('Impossible de charger votre profil. Veuillez réessayer.');
                    return EMPTY;
                }),
                takeUntilDestroyed(),
            )
            .subscribe();
    }


    // TODO: remplacer par l'appel à l'API des commandes du client.
    private readonly orders = signal<Order[]>([
        { id: 'c1', number: 1042, status: 'READY', createdAt: '2026-11-14T10:12:00Z' },
        { id: 'c2', number: 1038, status: 'IN_PROGRESS', createdAt: '2026-11-12T16:40:00Z' },
        { id: 'c3', number: 1035, status: 'REGISTERED', createdAt: '2026-11-15T08:05:00Z' },
        { id: 'c4', number: 1011, status: 'COMPLETED', createdAt: '2026-10-28T11:30:00Z' },
        { id: 'c5', number: 987, status: 'CANCELLED', createdAt: '2026-10-03T09:15:00Z' },
    ]);

    protected readonly currentOrders = computed(() =>
        this.orders()
            .filter((order) => CURRENT_STATUSES.includes(order.status))
            .sort(byNewest),
    );
    protected readonly pastOrders = computed(() =>
        this.orders()
            .filter((order) => !CURRENT_STATUSES.includes(order.status))
            .sort(byNewest),
    );

    protected activeTab = signal<ProfileTab>('informations');
}
