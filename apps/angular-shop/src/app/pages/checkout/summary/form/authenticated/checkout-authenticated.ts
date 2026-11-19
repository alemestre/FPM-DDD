import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { ProfileService } from '../../../../../services/profile.service';
import { Checkout } from '../../../../../components/abstract-checkout';
import { addressSchema, EMPTY_ADDRESS } from '../billing-fields';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BillingField } from '../billing-field/billing-field';
import { PickupInfo } from '../pickup-info/pickup-info';
import { form, FormRoot } from '@angular/forms/signals';
import type { AddressModel } from '../billing-fields';

/**
 * Checkout du client connecté : ses coordonnées viennent de son compte, son adresse est préremplie
 * et modifiable pour cette commande seulement (le profil n'est pas mis à jour).
 */
@Component({
    selector: 'app-checkout-authenticated',
    imports: [BillingField, PickupInfo, FormRoot],
    templateUrl: './checkout-authenticated.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutAuthenticated extends Checkout {
    private readonly profileService = inject(ProfileService);
    protected readonly profile = this.profileService.profile;
    protected readonly profileLoading = computed(() => this.profile() === null && !this.serverError());
    protected readonly editingAddress = signal(false);

    /** Adresse du compte, remise à jour quand le profil arrive ; le formulaire la modifie pour cette commande seulement. */
    private readonly address = linkedSignal<AddressModel>(() => ({
        ...(this.profile()?.address ?? EMPTY_ADDRESS),
    }));

    protected readonly billingForm = form(
      this.address,
      addressSchema, {
        submission: {
            action: (field) =>
                this.submitOrder(
                    this.orderService.placeOrder({
                        items: this.orderItems(),
                        billingAddress: this.toBillingAddress(field().value()),
                    }),
                ),
        },
    });

    constructor() {
        super();
        this.profileService
            .getProfile()
            .pipe(takeUntilDestroyed())
            .subscribe({
                error: () =>
                    this.serverError.set(
                        "Impossible de charger l'adresse de votre compte. Veuillez réessayer.",
                    ),
            });
    }
}
