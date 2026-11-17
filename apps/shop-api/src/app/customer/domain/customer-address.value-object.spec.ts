import { DomainValidationError } from "../../shared/domain/errors/domain-validation.error";
import { CustomerAddress } from "./customer-address.value-object";

describe("CustomerAddress", () => {
  const valid = { line1: " 1 rue des Lilas ", line2: " Bât. B ", postalCode: "29 000", city: " Quimper " };

  it("normalise les valeurs", () => {
    const address = CustomerAddress.create(valid);

    expect(address.line1).toBe("1 rue des Lilas");
    expect(address.line2).toBe("Bât. B");
    expect(address.postalCode).toBe("29000");
    expect(address.city).toBe("Quimper");
  });

  it("utilise un complément vide par défaut", () => {
    expect(CustomerAddress.create({ ...valid, line2: undefined }).line2).toBe("");
  });

  it.each([
    ["line1", { ...valid, line1: "  " }],
    ["city", { ...valid, city: "" }],
    ["postalCode", { ...valid, postalCode: "2900" }]
  ])("refuse une adresse dont %s est invalide", (_field, props) => {
    expect(() => CustomerAddress.create(props)).toThrow(DomainValidationError);
  });

  it("compare par valeur", () => {
    expect(CustomerAddress.create(valid).equals(CustomerAddress.create(valid))).toBe(true);
    expect(CustomerAddress.create(valid).equals(CustomerAddress.create({ ...valid, city: "Brest" }))).toBe(false);
  });
});
