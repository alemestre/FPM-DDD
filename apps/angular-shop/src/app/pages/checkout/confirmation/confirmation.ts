import { CheckoutSessionService } from '../../../services/checkout-session.service';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { PickupInfo } from '../summary/form/pickup-info/pickup-info';
import { CurrencyPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

/** Commande que l'API vient d'enregistrer. Sans commande en mémoire (page rechargée), retour à l'accueil. */
@Component({
    selector: 'app-checkout-confirmation',
    imports: [PickupInfo, CurrencyPipe, RouterLink],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: "./confirmation.html" ,
})
export class Confirmation {
    protected readonly order = inject(CheckoutSessionService).lastOrder;

    /** `YYYY-MM-DD` de l'API → jour calendaire à 00:00 UTC, attendu par app-pickup-info. */
    protected readonly pickupDate = computed(() => {
        const day = this.order()?.estimatedPickupDate;
        return day ? new Date(`${day}T00:00:00Z`) : null;
    });

    constructor() {
        if (!this.order()) {
            void inject(Router).navigateByUrl('/home');
        }
    }
}
