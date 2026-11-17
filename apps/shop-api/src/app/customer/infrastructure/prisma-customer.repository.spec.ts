import { CustomerAddress } from "../domain/customer-address.value-object";
import { PrismaCustomerRepository } from "./prisma-customer.repository";
import type { PrismaService } from "../../../prisma/prisma.service";
import { Customer } from "../domain/customer.entity";

jest.mock("../../../prisma/prisma.service", () => ({ PrismaService: class {} }));

const CUSTOMER_ID = "3f0c9a52-8a6e-4c1b-9d57-2b1e7f4a6c10";

const customerRow = (overrides: Record<string, unknown> = {}) => ({
  id: CUSTOMER_ID,
  phone: "+33612345678",
  addressLine1: "1 rue des Lilas",
  addressLine2: "Bât. B",
  postalCode: "29000",
  city: "Quimper",
  user: { email: "marie@example.fr", firstName: "Marie", lastName: "Durand" },
  ...overrides
});

const createPrismaMock = () => ({
  $transaction: jest.fn(async (operations: unknown[]) => operations),
  user: { update: jest.fn((args: unknown) => ({ model: "user", args })) },
  customer: {
    findUnique: jest.fn(),
    update: jest.fn((args: unknown) => ({ model: "customer", args }))
  }
});

describe("PrismaCustomerRepository", () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let repository: PrismaCustomerRepository;

  beforeEach(() => {
    prisma = createPrismaMock();
    repository = new PrismaCustomerRepository(prisma as unknown as PrismaService);
  });

  describe("findById", () => {
    it("charge le client avec le nom et l'e-mail de son compte", async () => {
      prisma.customer.findUnique.mockResolvedValue(customerRow());

      const customer = await repository.findById(CUSTOMER_ID);

      expect(prisma.customer.findUnique).toHaveBeenCalledWith({
        where: { id: CUSTOMER_ID },
        include: { user: { select: { email: true, firstName: true, lastName: true } } }
      });
      expect(customer).toBeInstanceOf(Customer);
      expect(customer?.email).toBe("marie@example.fr");
      expect(customer?.firstName).toBe("Marie");
      expect(customer?.phone).toBe("+33612345678");
      expect(customer?.address?.line2).toBe("Bât. B");
      expect(customer?.address?.city).toBe("Quimper");
    });

    it("n'a pas d'adresse quand les colonnes sont vides", async () => {
      prisma.customer.findUnique.mockResolvedValue(
        customerRow({ addressLine1: null, addressLine2: "", postalCode: null, city: null })
      );

      const customer = await repository.findById(CUSTOMER_ID);

      expect(customer?.address).toBeNull();
    });

    it("renvoie null sans profil client", async () => {
      prisma.customer.findUnique.mockResolvedValue(null);

      await expect(repository.findById(CUSTOMER_ID)).resolves.toBeNull();
    });
  });

  describe("save", () => {
    it("met à jour le compte et le profil dans une même transaction", async () => {
      const customer = Customer.reconstitute(
        CUSTOMER_ID,
        "marie@example.fr",
        "Anne",
        "Martin",
        "+33698765432",
        CustomerAddress.create({ line1: "2 quai Est", postalCode: "29200", city: "Brest" })
      );

      await repository.save(customer);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: CUSTOMER_ID },
        data: { firstName: "Anne", lastName: "Martin" }
      });
      expect(prisma.customer.update).toHaveBeenCalledWith({
        where: { id: CUSTOMER_ID },
        data: {
          phone: "+33698765432",
          addressLine1: "2 quai Est",
          addressLine2: "",
          postalCode: "29200",
          city: "Brest"
        }
      });
      expect(prisma.$transaction).toHaveBeenCalledWith([
        prisma.user.update.mock.results[0].value,
        prisma.customer.update.mock.results[0].value
      ]);
    });

    it("vide les colonnes d'adresse quand l'adresse est supprimée", async () => {
      const customer = Customer.reconstitute(CUSTOMER_ID, "marie@example.fr", "Marie", "Durand", "+33612345678", null);

      await repository.save(customer);

      expect(prisma.customer.update).toHaveBeenCalledWith({
        where: { id: CUSTOMER_ID },
        data: { phone: "+33612345678", addressLine1: null, addressLine2: "", postalCode: null, city: null }
      });
    });
  });
});
