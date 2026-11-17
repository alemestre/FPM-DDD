import { DomainValidationError } from "../../../shared/domain/errors/domain-validation.error";
import { CustomerAddress } from "../../domain/customer-address.value-object";
import { UpdateCustomerProfileUseCase } from "./update-customer-profile.use-case";
import { CustomerRepository } from "../../domain/customer.repository";
import { Customer } from "../../domain/customer.entity";
import { NotFoundException } from "@nestjs/common";

const CUSTOMER_ID = "3f0c9a52-8a6e-4c1b-9d57-2b1e7f4a6c10";

const existingCustomer = () =>
  Customer.reconstitute(
    CUSTOMER_ID,
    "marie@example.fr",
    "Marie",
    "Durand",
    "+33612345678",
    CustomerAddress.create({ line1: "1 rue des Lilas", postalCode: "29000", city: "Quimper" })
  );

describe("UpdateCustomerProfileUseCase", () => {
  let repository: jest.Mocked<CustomerRepository>;
  let useCase: UpdateCustomerProfileUseCase;

  beforeEach(() => {
    repository = { findById: jest.fn(), save: jest.fn() };
    useCase = new UpdateCustomerProfileUseCase(repository);
  });

  it("applique les modifications via l'entité puis sauvegarde", async () => {
    repository.findById.mockResolvedValue(existingCustomer());

    const updated = await useCase.execute(CUSTOMER_ID, {
      lastName: " Martin ",
      phone: "06 98 76 54 32",
      address: { line1: "2 quai Est", postalCode: "29 200", city: "Brest" }
    });

    expect(repository.save).toHaveBeenCalledWith(updated);
    expect(updated.firstName).toBe("Marie");
    expect(updated.lastName).toBe("Martin");
    expect(updated.phone).toBe("+33698765432");
    expect(updated.address?.line1).toBe("2 quai Est");
    expect(updated.address?.line2).toBe("");
    expect(updated.address?.postalCode).toBe("29200");
    expect(updated.email).toBe("marie@example.fr");
  });

  it("garde l'adresse quand elle n'est pas envoyée", async () => {
    repository.findById.mockResolvedValue(existingCustomer());

    const updated = await useCase.execute(CUSTOMER_ID, { firstName: "Anne" });

    expect(updated.firstName).toBe("Anne");
    expect(updated.address?.city).toBe("Quimper");
  });

  it("supprime l'adresse avec address: null", async () => {
    repository.findById.mockResolvedValue(existingCustomer());

    const updated = await useCase.execute(CUSTOMER_ID, { address: null });

    expect(updated.address).toBeNull();
    expect(repository.save).toHaveBeenCalledWith(updated);
  });

  it("ne sauvegarde rien si une valeur est invalide", async () => {
    repository.findById.mockResolvedValue(existingCustomer());

    await expect(
      useCase.execute(CUSTOMER_ID, { address: { line1: "2 quai Est", postalCode: "123", city: "Brest" } })
    ).rejects.toBeInstanceOf(DomainValidationError);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it("répond 404 quand le compte n'a pas de profil client", async () => {
    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute(CUSTOMER_ID, { firstName: "Anne" })).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.save).not.toHaveBeenCalled();
  });
});
