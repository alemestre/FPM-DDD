import type { Customer } from "./customer.entity";

/**
 * Persistence port for the Customer aggregate.
 *
 * It does not extend GenericEntityRepository: customers are created by the auth
 * context at registration and are never listed or deleted here.
 */
export abstract class CustomerRepository {
  /**
   * @param id - Customer identity (same as the user id).
   * @returns The customer when the user has a customer profile, otherwise `null`.
   */
  abstract findById(id: string): Promise<Customer | null>;

  /** Persists the profile changes of an existing customer. */
  abstract save(customer: Customer): Promise<void>;
}
