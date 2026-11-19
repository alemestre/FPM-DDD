import { CustomerAddress } from "../../domain/customer-address.value-object";
import type { UpdateCustomerProfileInput } from "../update-customer-profile.input";
import { CustomerRepository } from "../../domain/customer.repository";
import type { Customer } from "../../domain/customer.entity";
import { Inject, NotFoundException } from "@nestjs/common";

export class UpdateCustomerProfileUseCase {
  constructor(@Inject(CustomerRepository) private readonly repository: CustomerRepository) {}

  /**
   * Applies a partial update through the Customer aggregate, so every change
   * goes through the domain invariants before being persisted.
   */
  async execute(customerId: string, input: UpdateCustomerProfileInput): Promise<Customer> {
    const { firstName, lastName, phone, address } = input;
    const customer = await this.repository.findById(customerId);

    if (!customer) {
      throw new NotFoundException();
    }

    if (firstName !== undefined || lastName !== undefined) {
      customer.rename(firstName ?? customer.firstName, lastName ?? customer.lastName);
    }
    if (phone !== undefined) customer.changePhone(phone);
    if (address !== undefined) customer.changeAddress(CustomerAddress.create(address));

    await this.repository.save(customer);
    return customer;
  }
}
