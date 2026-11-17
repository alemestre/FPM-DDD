import type { CustomerAddressProps } from "../domain/customer-address.value-object";

/** Partial update: omitted fields are left unchanged, `address: null` removes the address. */
export interface UpdateCustomerProfileInput {
  readonly firstName?: string;
  readonly lastName?: string;
  readonly phone?: string;
  readonly address?: CustomerAddressProps | null;
}
