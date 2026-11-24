import {
    addressSchema,
    contactSchema,
    CONTACT_FIELDS,
    EMPTY_ADDRESS,
    EMPTY_CONTACT,
} from '../billing-fields';
import type { AddressModel, ContactModel } from '../billing-fields';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { apply, form, FormRoot } from '@angular/forms/signals';
import { BillingField } from '../billing-field/billing-field';
import { PickupInfo } from '../pickup-info/pickup-info';
import { CHECKOUT_IDENTIFICATION_URL } from '../../../../../guards/checkout-access.guard';
import { RouterLink } from '@angular/router';
import { Checkout } from '../../../../../shared/abstract-checkout';

interface GuestCheckoutModel {
    contact: ContactModel;
    address: AddressModel;
}

/** Checkout de l'invité : il saisit ses coordonnées et son adresse de facturation. */
@Component({
    selector: 'app-checkout-guest',
    imports: [BillingField, PickupInfo, FormRoot, RouterLink],
    templateUrl: './checkout-guest.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutGuest extends Checkout {
    protected readonly contactFields = CONTACT_FIELDS;
    protected readonly identificationUrl = CHECKOUT_IDENTIFICATION_URL;

    private readonly model = signal<GuestCheckoutModel>({
        contact: { ...EMPTY_CONTACT },
        address: { ...EMPTY_ADDRESS },
    });

    protected readonly billingForm = form(
        this.model,
        (path) => {
            apply(path.contact, contactSchema);
            apply(path.address, addressSchema);
        },
        {
            submission: {
                action: (field) => {
                    const { contact, address } = field().value();
                    return this.submitOrder(
                        this.orderService.placeGuestOrder({
                            items: this.orderItems(),
                            billingAddress: this.toBillingAddress(address),
                            contact: {
                                firstName: contact.firstName.trim(),
                                lastName: contact.lastName.trim(),
                                email: contact.email.trim(),
                                phone: contact.phone,
                            },
                        }),
                    );
                },
            },
        },
    );
}
