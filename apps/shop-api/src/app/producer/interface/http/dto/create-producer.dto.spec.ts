import { CreateProducerSchema } from "./create-producer.dto";
import { UpdateProducerSchema } from "./update-producer.dto";

const validProducer = {
  name: "Producer",
  contactEmail: "producer@example.com",
  phoneNumber: "0123456789",
  vatNumber: "1234567890123",
  addressLine1: "1 Main Street",
  addressLine2: "",
  postalCode: "12345",
  city: "Paris"
};

describe("Producer schemas", () => {
  it("accepts a 10-digit phone number and a 13-character VAT number", () => {
    expect(CreateProducerSchema.safeParse(validProducer).success).toBe(true);
  });

  it("rejects a producer when a required property is missing", () => {
    const requiredProperties = [
      "name",
      "contactEmail",
      "phoneNumber",
      "vatNumber",
      "addressLine1",
      "postalCode",
      "city"
    ] as const;

    for (const property of requiredProperties) {
      const producerWithoutProperty: Record<string, unknown> = { ...validProducer };
      delete producerWithoutProperty[property];

      expect(CreateProducerSchema.safeParse(producerWithoutProperty).success).toBe(false);
    }
  });

  it("trims the contact email before validating it", () => {
    const parsed = CreateProducerSchema.safeParse({
      ...validProducer,
      contactEmail: "  producer@example.com  "
    });

    expect(parsed.success).toBe(true);
    expect(parsed.data?.contactEmail).toBe("producer@example.com");
  });

  it("rejects an invalid contact email", () => {
    expect(
      CreateProducerSchema.safeParse({ ...validProducer, contactEmail: " not-an-email " }).success
    ).toBe(false);
  });

  it("rejects VAT numbers shorter than 13 characters on create and update", () => {
    expect(
      CreateProducerSchema.safeParse({
        ...validProducer,
        vatNumber: "123456789012"
      }).success
    ).toBe(false);
    expect(
      UpdateProducerSchema.safeParse({
        vatNumber: "123456789012"
      }).success
    ).toBe(false);
  });
});
