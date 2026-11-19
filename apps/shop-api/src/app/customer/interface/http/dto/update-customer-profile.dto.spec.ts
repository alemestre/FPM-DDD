import { UpdateCustomerProfileSchema } from "./update-customer-profile.dto";

const address = { line1: "1 rue des Lilas", postalCode: "29000", city: "Quimper" };

describe("UpdateCustomerProfileSchema", () => {
  it("accepte une modification partielle", () => {
    expect(UpdateCustomerProfileSchema.safeParse({ phone: "0612345678" }).success).toBe(true);
    expect(UpdateCustomerProfileSchema.safeParse({}).success).toBe(true);
  });

  it("accepte une adresse complète", () => {
    expect(UpdateCustomerProfileSchema.safeParse({ address }).success).toBe(true);
  });

  it("refuse la suppression de l'adresse (null)", () => {
    expect(UpdateCustomerProfileSchema.safeParse({ address: null }).success).toBe(false);
  });

  it.each(["line1", "postalCode", "city"] as const)("refuse une adresse sans %s", (field) => {
    const incomplete: Partial<typeof address> = { ...address };
    delete incomplete[field];
    expect(UpdateCustomerProfileSchema.safeParse({ address: incomplete }).success).toBe(false);
  });

  it("refuse un prénom vide", () => {
    expect(UpdateCustomerProfileSchema.safeParse({ firstName: "  " }).success).toBe(false);
  });

  it("refuse la modification de l'e-mail et les champs inconnus", () => {
    expect(UpdateCustomerProfileSchema.safeParse({ email: "x@y.fr" }).success).toBe(false);
    expect(UpdateCustomerProfileSchema.safeParse({ address: { ...address, country: "FR" } }).success).toBe(false);
  });
});
