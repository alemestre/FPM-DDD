import { CustomerRepository } from "../../domain/customer.repository";
import type { Customer } from "../../domain/customer.entity";
import { Inject, NotFoundException } from "@nestjs/common";

/** Loads the profile of the signed-in user. Accounts without a customer profile (admins) get a 404. */
export class GetCustomerProfileUseCase {
  constructor(@Inject(CustomerRepository) private readonly repository: CustomerRepository) {}

  async execute(customerId: string): Promise<Customer> {
    const customer = await this.repository.findById(customerId);

    if (!customer) {
      throw new NotFoundException();
    }

    return customer;
  }
}
