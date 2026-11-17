import { GetCustomerProfileUseCase } from "./get-customer-profile.use-case";
import { CustomerRepository } from "../../domain/customer.repository";
import { Customer } from "../../domain/customer.entity";
import { NotFoundException } from "@nestjs/common";

const CUSTOMER_ID = "3f0c9a52-8a6e-4c1b-9d57-2b1e7f4a6c10";

describe("GetCustomerProfileUseCase", () => {
  let repository: jest.Mocked<CustomerRepository>;
  let useCase: GetCustomerProfileUseCase;

  beforeEach(() => {
    repository = { findById: jest.fn(), save: jest.fn() };
    useCase = new GetCustomerProfileUseCase(repository);
  });

  it("renvoie le profil du client", async () => {
    const customer = Customer.reconstitute(CUSTOMER_ID, "marie@example.fr", "Marie", "Durand", "+33612345678", null);
    repository.findById.mockResolvedValue(customer);

    await expect(useCase.execute(CUSTOMER_ID)).resolves.toBe(customer);
    expect(repository.findById).toHaveBeenCalledWith(CUSTOMER_ID);
  });

  it("répond 404 quand le compte n'a pas de profil client", async () => {
    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute(CUSTOMER_ID)).rejects.toBeInstanceOf(NotFoundException);
  });
});
