import type { CustomerAddressProps } from "../domain/customer-address.value-object";

/** Partial update: omitted fields are left unchanged. The address can be replaced, not removed. */
export interface UpdateCustomerProfileInput {
  readonly firstName?: string;
  readonly lastName?: string;
  readonly phone?: string;
  readonly address?: CustomerAddressProps;
}
