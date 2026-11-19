import { DomainValidationError } from "../../shared/domain/errors/domain-validation.error";
import { CustomerAddress } from "./customer-address.value-object";
import { Customer } from "./customer.entity";

const CUSTOMER_ID = "3f0c9a52-8a6e-4c1b-9d57-2b1e7f4a6c10";

const address = () => CustomerAddress.create({ line1: "1 rue des Lilas", postalCode: "29000", city: "Quimper" });

const customer = () =>
  Customer.reconstitute(CUSTOMER_ID, "marie.durand@example.fr", "Marie", "Durand", "+33612345678", address());

describe("Customer", () => {
  it("renomme le client avec des noms nettoyés", () => {
    const c = customer();

    c.rename(" Anne ", " Martin ");

    expect(c.firstName).toBe("Anne");
    expect(c.lastName).toBe("Martin");
  });

  it("ne change aucun nom si l'un des deux est vide", () => {
    const c = customer();

    expect(() => c.rename("Anne", "  ")).toThrow(DomainValidationError);
    expect(c.firstName).toBe("Marie");
    expect(c.lastName).toBe("Durand");
  });

  it("normalise le téléphone au format E.164", () => {
    const c = customer();

    c.changePhone("06 98 76 54 32");

    expect(c.phone).toBe("+33698765432");
  });

  it("refuse un téléphone invalide et garde l'ancien", () => {
    const c = customer();

    expect(() => c.changePhone("12")).toThrow(DomainValidationError);
    expect(c.phone).toBe("+33612345678");
  });

  it("remplace l'adresse", () => {
    const c = customer();
    const newAddress = CustomerAddress.create({ line1: "2 quai Est", postalCode: "29200", city: "Brest" });

    c.changeAddress(newAddress);
    expect(c.address).toBe(newAddress);
  });
});
