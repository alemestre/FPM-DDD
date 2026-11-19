import type { CustomerProfileResponseDto } from "@fpm/contracts";
import type { Customer } from "../../domain/customer.entity";

/** Maps the aggregate to its public HTTP representation, through its getters. */
export function toCustomerProfileResponse(customer: Customer): CustomerProfileResponseDto {
  const { address } = customer;

  return {
    id: customer.id,
    email: customer.email,
    firstName: customer.firstName,
    lastName: customer.lastName,
    phone: customer.phone,
    address: {
      line1: address.line1,
      line2: address.line2,
      postalCode: address.postalCode,
      city: address.city
    }
  };
}
