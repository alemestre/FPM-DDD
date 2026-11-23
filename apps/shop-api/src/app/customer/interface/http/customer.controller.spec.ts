import { DomainValidationErrorFilter } from "../../../shared/interface/http/domain-validation-error.filter";
import { ApiResponseInterceptor } from "../../../shared/interface/http/api-response.interceptor";
import { JwtCookieAuthGuard } from "../../../auth/interface/http/guards/jwt-cookie-auth.guard";
import { UpdateCustomerProfileUseCase } from "../../application/use-cases/update-customer-profile.use-case";
import { GetCustomerProfileUseCase } from "../../application/use-cases/get-customer-profile.use-case";
import { ACCESS_TOKEN_COOKIE } from "../../../auth/interface/http/auth.constants";
import { PostalAddress } from "../../../shared/domain/value-objects/postal-address.value-object";
import { CustomerRepository } from "../../domain/customer.repository";
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from "@nestjs/core";
import { Customer } from "../../domain/customer.entity";
import { CustomerController } from "./customer.controller";
import type { INestApplication } from "@nestjs/common";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { ZodValidationPipe } from "nestjs-zod";
import { Test } from "@nestjs/testing";
import cookieParser from "cookie-parser";

const CUSTOMER_ID = "3f0c9a52-8a6e-4c1b-9d57-2b1e7f4a6c10";
const ADMIN_ID = "9b2d7c1e-4f3a-4e8b-a6d5-1c0f2e3d4b5a";

class InMemoryCustomerRepository extends CustomerRepository {
  readonly customers = new Map<string, Customer>();

  async findById(id: string): Promise<Customer | null> {
    return this.customers.get(id) ?? null;
  }

  async save(customer: Customer): Promise<void> {
    this.customers.set(customer.id, customer);
  }
}

describe("CustomerController (HTTP)", () => {
  let app: INestApplication;
  let repository: InMemoryCustomerRepository;
  let baseUrl: string;
  let customerCookie: string;
  let adminCookie: string;

  const request = async (method: string, cookie: string | null, body?: unknown) => {
    const response = await fetch(`${baseUrl}/customers/me`, {
      method,
      headers: { "content-type": "application/json", ...(cookie && { cookie }) },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const text = await response.text();
    return { status: response.status, body: text ? JSON.parse(text) : undefined };
  };

  const seedCustomer = () =>
    repository.customers.set(
      CUSTOMER_ID,
      Customer.reconstitute(
        CUSTOMER_ID,
        "marie@example.fr",
        "Marie",
        "Durand",
        "+33612345678",
        PostalAddress.create({ line1: "1 rue des Lilas", postalCode: "29000", city: "Quimper" })
      )
    );

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: "test-secret" })],
      controllers: [CustomerController],
      providers: [
        JwtCookieAuthGuard,
        GetCustomerProfileUseCase,
        UpdateCustomerProfileUseCase,
        { provide: CustomerRepository, useClass: InMemoryCustomerRepository },
        { provide: APP_PIPE, useClass: ZodValidationPipe },
        { provide: APP_INTERCEPTOR, useClass: ApiResponseInterceptor },
        { provide: APP_FILTER, useClass: DomainValidationErrorFilter }
      ]
    }).compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    await app.listen(0);
    baseUrl = await app.getUrl();
    repository = moduleRef.get(CustomerRepository);

    const jwt = moduleRef.get(JwtService);
    customerCookie = `${ACCESS_TOKEN_COOKIE}=${await jwt.signAsync({ sub: CUSTOMER_ID })}`;
    adminCookie = `${ACCESS_TOKEN_COOKIE}=${await jwt.signAsync({ sub: ADMIN_ID })}`;
  });

  beforeEach(() => {
    repository.customers.clear();
    seedCustomer();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("GET /customers/me", () => {
    it("renvoie le profil du client connecté", async () => {
      const { status, body } = await request("GET", customerCookie);

      expect(status).toBe(200);
      expect(body).toEqual({
        success: true,
        data: {
          id: CUSTOMER_ID,
          email: "marie@example.fr",
          firstName: "Marie",
          lastName: "Durand",
          phone: "+33612345678",
          address: { line1: "1 rue des Lilas", line2: "", postalCode: "29000", city: "Quimper" }
        }
      });
    });

    it("renvoie 401 sans session", async () => {
      expect((await request("GET", null)).status).toBe(401);
    });

    it("renvoie 404 pour un compte sans profil client", async () => {
      expect((await request("GET", adminCookie)).status).toBe(404);
    });
  });

  describe("PATCH /customers/me", () => {
    it("modifie le téléphone et remplace l'adresse", async () => {
      const { status, body } = await request("PATCH", customerCookie, {
        phone: "06 98 76 54 32",
        address: { line1: "2 quai Est", line2: "Bât. B", postalCode: "29200", city: "Brest" }
      });

      expect(status).toBe(200);
      expect(body.data).toMatchObject({
        firstName: "Marie",
        phone: "+33698765432",
        address: { line1: "2 quai Est", line2: "Bât. B", postalCode: "29200", city: "Brest" }
      });
      expect(repository.customers.get(CUSTOMER_ID)?.phone).toBe("+33698765432");
    });

    it("renvoie 400 si l'adresse est supprimée (address: null)", async () => {
      const { status } = await request("PATCH", customerCookie, { address: null });

      expect(status).toBe(400);
      expect(repository.customers.get(CUSTOMER_ID)?.address.line1).toBe("1 rue des Lilas");
    });

    it("renvoie 400 si l'e-mail est envoyé", async () => {
      expect((await request("PATCH", customerCookie, { email: "x@y.fr" })).status).toBe(400);
    });

    it("renvoie 400 si le code postal est invalide (règle du domaine)", async () => {
      const { status } = await request("PATCH", customerCookie, {
        address: { line1: "1 rue des Lilas", postalCode: "123", city: "Quimper" }
      });

      expect(status).toBe(400);
      expect(repository.customers.get(CUSTOMER_ID)?.address.postalCode).toBe("29000");
    });

    it("renvoie 401 sans session", async () => {
      expect((await request("PATCH", null, { firstName: "Anne" })).status).toBe(401);
    });

    it("renvoie 404 pour un compte sans profil client", async () => {
      expect((await request("PATCH", adminCookie, { firstName: "Anne" })).status).toBe(404);
    });
  });
});
