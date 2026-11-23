import type { OrderContactProps } from '../domain/order-contact.value-object';
import type { PostalAddressProps } from '../../shared/domain/value-objects/postal-address.value-object';

export interface PlaceOrderItemInput {
    readonly productId: string;
    readonly quantity: number;
}

interface PlaceOrderBaseInput {
    readonly items: readonly PlaceOrderItemInput[];
    readonly billingAddress: PostalAddressProps;
}

/** Order of a signed-in customer: the contact details come from the account. */
export interface PlaceCustomerOrderInput extends PlaceOrderBaseInput {
    readonly customerId: string;
}

/** Order of a guest, who gives their contact details. */
export interface PlaceGuestOrderInput extends PlaceOrderBaseInput {
    readonly contact: OrderContactProps;
}

export type PlaceOrderInput = PlaceCustomerOrderInput | PlaceGuestOrderInput;
