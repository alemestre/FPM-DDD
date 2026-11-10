import { DomainValidationErrorFilter } from '../../../shared/interface/http/domain-validation-error.filter';
import { ProductReferenceNotFoundError } from '../../domain/errors/product-reference-not-found.error';
import { type INestApplication, NotFoundException } from '@nestjs/common';
import { ProductRepository } from '../../domain/product.repository';
import { Product } from '../../domain/product.entity';
import { ProductModule } from '../../product.module';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { Test } from '@nestjs/testing';

jest.mock('uuid', () => ({
  v4: jest.fn(() => '12345678-1234-4123-8123-123456789abc'),
  validate: jest.fn((value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
  ),
}));

jest.mock('../../infrastructure/prisma-product.repository', () => ({ PrismaProductRepository: class {} }));

const NEW_ID = '12345678-1234-4123-8123-123456789abc';
const PRODUCT_ID = 'e3bb189e-8bf9-4888-9912-ace4e6543002';
const PRODUCER_ID = 'a3bb189e-8bf9-4888-9912-ace4e6543002';
const MISSING_PRODUCER_ID = 'f3bb189e-8bf9-4888-9912-ace4e6543002';
const CATEGORY_A = 'b3bb189e-8bf9-4888-9912-ace4e6543002';

/**
 * In-memory ProductRepository honouring the port contract, including
 * ProductReferenceNotFoundError for unknown producers.
 */
class InMemoryProductRepository extends ProductRepository {
  readonly products = new Map<string, Product>();

  async save(product: Product): Promise<Product> {
    if (product.producerId === MISSING_PRODUCER_ID) throw new ProductReferenceNotFoundError();
    this.products.set(product.id, product);
    return product;
  }

  async findById(id: string): Promise<Product | null> {
    return this.products.get(id) ?? null;
  }

  async findByIdOrFail(id: string): Promise<Product> {
    const product = this.products.get(id);
    if (!product) throw new NotFoundException();
    return product;
  }

  async findAll(): Promise<Product[]> {
    return [...this.products.values()];
  }

  async update(): Promise<Product> {
    throw new Error('not used by the product use cases');
  }

  async delete(id: string): Promise<void> {
    this.products.delete(id);
  }
}

describe('ProductController (HTTP)', () => {
  let app: INestApplication;
  let repository: InMemoryProductRepository;
  let baseUrl: string;

  const request = async (method: string, path: string, body?: unknown) => {
    const response = await fetch(`${baseUrl}/products${path}`, {
      method,
      headers: { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    return { status: response.status, body: text ? JSON.parse(text) : undefined };
  };

  const seedProduct = () =>
    repository.products.set(
      PRODUCT_ID,
      Product.reconstitute(PRODUCT_ID, 'Pommes Golden', 3.5, 5.5, 20, 5, PRODUCER_ID, CATEGORY_A, 'KG'),
    );

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ProductModule],
      providers: [
        { provide: APP_PIPE, useClass: ZodValidationPipe },
        { provide: APP_FILTER, useClass: DomainValidationErrorFilter },
      ],
    })
      .overrideProvider(ProductRepository)
      .useClass(InMemoryProductRepository)
      .compile();

    app = moduleRef.createNestApplication();
    await app.listen(0);
    baseUrl = await app.getUrl();
    repository = moduleRef.get(ProductRepository);
  });

  beforeEach(() => repository.products.clear());

  afterAll(async () => {
    await app.close();
  });

  const expectedProduct = {
    id: PRODUCT_ID,
    name: 'Pommes Golden',
    price: 3.5,
    vatRate: 5.5,
    stock: 20,
    minStock: 5,
    producerId: PRODUCER_ID,
    categoryId: CATEGORY_A,
    unit: 'KG',
  };

  describe('POST /products', () => {
    const payload = { name: 'Pommes Golden', price: 3.5, vatRate: 5.5, stock: 20, minStock: 5, producerId: PRODUCER_ID, categoryId: CATEGORY_A, unit: 'KG' };

    it('crée le produit et renvoie sa représentation publique (201)', async () => {
      const { status, body } = await request('POST', '', payload);

      expect(status).toBe(201);
      expect(body).toEqual({ ...expectedProduct, id: NEW_ID });
      expect(repository.products.has(NEW_ID)).toBe(true);
    });

    it("crée le produit en KG quand l'unité est omise", async () => {
      // `undefined` is dropped by JSON serialization, so the body has no unit.
      const { status, body } = await request('POST', '', { ...payload, unit: undefined });

      expect(status).toBe(201);
      expect(body).toEqual({ ...expectedProduct, id: NEW_ID, unit: 'KG' });
    });

    it('renvoie 400 si l\'unité est inconnue', async () => {
      const { status } = await request('POST', '', { ...payload, unit: 'LITRE' });

      expect(status).toBe(400);
      expect(repository.products.size).toBe(0);
    });

    it('renvoie 400 si le corps est invalide', async () => {
      const { status } = await request('POST', '', { ...payload, price: 'cher' });

      expect(status).toBe(400);
      expect(repository.products.size).toBe(0);
    });

    it('renvoie 400 si le stock est inférieur au stock minimum', async () => {
      const { status, body } = await request('POST', '', { ...payload, stock: 4 });

      expect(status).toBe(400);
      expect(body.message).toBe('Le stock (4) ne peut pas être inférieur au stock minimum (5)');
    });

    it("renvoie 400 si le producteur n'existe pas", async () => {
      const { status, body } = await request('POST', '', { ...payload, producerId: MISSING_PRODUCER_ID });

      expect(status).toBe(400);
      expect(body.message).toBe("Le producteur ou la catégorie du produit n'existe pas");
    });
  });

  describe('GET', () => {
    it('liste les produits', async () => {
      seedProduct();

      const { status, body } = await request('GET', '');

      expect(status).toBe(200);
      expect(body).toEqual([expectedProduct]);
    });

    it('renvoie un produit par id', async () => {
      seedProduct();

      const { status, body } = await request('GET', `/${PRODUCT_ID}`);

      expect(status).toBe(200);
      expect(body).toEqual(expectedProduct);
    });

    it("renvoie 404 si le produit n'existe pas", async () => {
      expect((await request('GET', `/${PRODUCT_ID}`)).status).toBe(404);
    });

    it("renvoie 400 si l'id n'est pas un UUID", async () => {
      expect((await request('GET', '/abc')).status).toBe(400);
    });
  });

  describe('PATCH /products/:id', () => {
    it('met à jour les champs fournis', async () => {
      seedProduct();

      const { status, body } = await request('PATCH', `/${PRODUCT_ID}`, { price: 4, minStock: 10 });

      expect(status).toBe(200);
      expect(body).toEqual({ ...expectedProduct, price: 4, minStock: 10 });
    });

    it('refuse une modification directe du stock (400)', async () => {
      seedProduct();

      const { status } = await request('PATCH', `/${PRODUCT_ID}`, { stock: 0 });

      expect(status).toBe(400);
      expect(repository.products.get(PRODUCT_ID)?.stock).toBe(20);
    });
  });

  describe('mouvements de stock', () => {
    it('POST /:id/restock augmente le stock (200)', async () => {
      seedProduct();

      const { status, body } = await request('POST', `/${PRODUCT_ID}/restock`, { quantity: 5 });

      expect(status).toBe(200);
      expect(body.stock).toBe(25);
    });

    it('POST /:id/withdraw diminue le stock (200)', async () => {
      seedProduct();

      const { status, body } = await request('POST', `/${PRODUCT_ID}/withdraw`, { quantity: 15 });

      expect(status).toBe(200);
      expect(body.stock).toBe(5);
    });

    it('POST /:id/withdraw renvoie 400 si le stock passerait sous le minimum', async () => {
      seedProduct();

      const { status } = await request('POST', `/${PRODUCT_ID}/withdraw`, { quantity: 16 });

      expect(status).toBe(400);
      expect(repository.products.get(PRODUCT_ID)?.stock).toBe(20);
    });
  });

  it('DELETE /products/:id supprime le produit (204)', async () => {
    seedProduct();

    const { status } = await request('DELETE', `/${PRODUCT_ID}`);

    expect(status).toBe(204);
    expect(repository.products.has(PRODUCT_ID)).toBe(false);
  });
});
