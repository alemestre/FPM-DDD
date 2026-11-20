import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CustomerInformation } from './information/customer-information';
import { isCurrentOrder, OrdersService } from '../../services/orders.service';
import { NotificationService } from '../../services/notification.service';
import { CustomerOrders } from './orders/customer-orders';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProfileService } from '../../services/profile.service';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import type { OrderResponseDto } from '@fpm/contracts';
import { TopBar } from './top-card/top-bar';
import { catchError, EMPTY } from 'rxjs';

type ProfileTab = 'informations' | 'commandes';


@Component({
    selector: 'app-profile',
  imports: [NgbNavModule, TopBar, CustomerInformation, CustomerOrders],
    templateUrl: './profile.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Profile {
  private readonly notificationService = inject(NotificationService)
  private readonly profileService = inject(ProfileService);
  private readonly ordersService = inject(OrdersService);

  /** Chargées une seule fois ici : le badge de l'onglet et la liste les partagent. */
  protected readonly ordersResource = this.ordersService.myOrdersResource();
  protected readonly orders = computed<readonly OrderResponseDto[]>(() =>
    this.ordersResource.hasValue() ? this.ordersResource.value().data : []
  );
  protected readonly hasOrdersError = computed(() => this.ordersResource.error() !== undefined);
  protected readonly currentOrdersCount = computed(() => this.orders().filter(isCurrentOrder).length);

  profile = this.profileService.profile

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

    protected activeTab = signal<ProfileTab>('informations');
}
