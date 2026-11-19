import { CheckoutSessionService } from '../../../services/checkout-session.service';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Login } from '../../auth/login/login';
import { Router } from '@angular/router';

export const CHECKOUT_URL = '/checkout';

/**
 * Proposée au visiteur non connecté qui passe au paiement : se connecter pour suivre ses commandes,
 * ou commander en tant qu'invité. Les deux mènent à la page checkout.
 */
@Component({
    selector: 'app-checkout-identification',
    imports: [Login],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: "./identification.html"
})
export class Identification {
    private readonly checkoutSession = inject(CheckoutSessionService);
    private readonly router = inject(Router);

    protected readonly checkoutUrl = CHECKOUT_URL;

    protected continueAsGuest(): void {
        this.checkoutSession.continueAsGuest();
        void this.router.navigateByUrl(CHECKOUT_URL);
    }
}
