import { CheckoutSessionService } from '../services/checkout-session.service';
import type { BillingAddressPayload, OrderItemPayload } from '../services/orders.service';
import { ADDRESS_FIELDS, AddressModel } from '../pages/checkout/summary/form/billing-fields';
import { estimatePickupDate } from './tools/pickup-date';
import { OrdersService } from '../services/orders.service';
import { CartService } from '../services/cart.service';
import { HttpErrorResponse } from '@angular/common/http';
import type { OrderResponseDto } from '@fpm/contracts';
import { effect, inject, signal } from '@angular/core';
import { firstValueFrom, type Observable } from 'rxjs';
import { Router } from '@angular/router';

export const CHECKOUT_CONFIRMATION_URL = '/checkout/confirmation';

/**
 * Ce que partagent le checkout invité et le checkout du client connecté : panier en lecture seule,
 * date de retrait indicative, envoi de la commande puis passage à la confirmation.
 * Chaque page ne définit que son formulaire et l'appel à l'API qui lui correspond.
 */
export abstract class Checkout {
    protected readonly checkoutSession = inject(CheckoutSessionService);
    protected readonly orderService = inject(OrdersService);
    protected readonly cart = inject(CartService);
    private readonly router = inject(Router);

    protected readonly addressFields = ADDRESS_FIELDS;
    protected readonly pickupDate = estimatePickupDate(new Date());
    protected readonly serverError = signal<string | null>(null);

    constructor() {
        effect(() => {
            if (this.cart.restored() && this.cart.isEmpty()) {
                void this.router.navigateByUrl('/panier');
            }
        });
    }

    /** Produits et quantités : l'API lit les prix dans son catalogue. */
    protected orderItems(): OrderItemPayload[] {
        return this.cart
            .items()
            .map(({ product, quantity }) => ({ productId: product.id, quantity }));
    }

    protected toBillingAddress({
        line1,
        line2,
        postalCode,
        city,
    }: AddressModel): BillingAddressPayload {
        return { line1: line1.trim(), line2: line2.trim(), postalCode, city: city.trim() };
    }

    /** Envoie la commande ; en cas de succès, ouvre la confirmation puis vide le panier. */
    protected async submitOrder(order$: Observable<OrderResponseDto>): Promise<undefined> {
        this.serverError.set(null);
        try {
            const order = await firstValueFrom(order$);
            this.checkoutSession.completeOrder(order);
            // Le panier est vidé après la navigation : vide, cette page renverrait vers /panier.
            await this.router.navigateByUrl(CHECKOUT_CONFIRMATION_URL);
            this.cart.clearCart();
        } catch (error) {
            this.serverError.set(this.toErrorMessage(error));
        }
        return undefined;
    }

    private toErrorMessage(error: unknown): string {
        if (error instanceof HttpErrorResponse && error.status === 400) {
            const message: unknown = error.error?.message;
            return typeof message === 'string'
                ? `Votre commande n'a pas pu être enregistrée : ${message}`
                : "Votre commande n'a pas pu être enregistrée : vérifiez vos informations.";
        }
        return 'Une erreur est survenue. Veuillez réessayer.';
    }
}
