import { DomainValidationError } from '../../shared/domain/errors/domain-validation.error';
import { Product } from './product.entity';

jest.mock('uuid', () => ({
  v4: jest.fn(() => '12345678-1234-4123-8123-123456789abc'),
  validate: jest.fn((value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
  ),
}));

const PRODUCER_ID = 'a3bb189e-8bf9-4888-9912-ace4e6543002';
const CATEGORY_A = 'b3bb189e-8bf9-4888-9912-ace4e6543002';
const CATEGORY_B = 'c3bb189e-8bf9-4888-9912-ace4e6543002';

const createProduct = (): Product =>
  Product.create(' Pommes Golden ', 3.5, 5.5, 20, 5, PRODUCER_ID, CATEGORY_A, 'KG');

describe('Product', () => {
  describe('create', () => {
    it('crée un produit avec des valeurs normalisées', () => {
      const product = createProduct();

      expect(product.id).toBe('12345678-1234-4123-8123-123456789abc');
      expect(product.name).toBe('Pommes Golden');
      expect(product.price).toBe(3.5);
      expect(product.vatRate).toBe(5.5);
      expect(product.stock).toBe(20);
      expect(product.minStock).toBe(5);
      expect(product.producerId).toBe(PRODUCER_ID);
      expect(product.categoryId).toBe(CATEGORY_A);
      expect(product.unit).toBe('KG');
    });

    it("utilise KG quand l'unité n'est pas précisée", () => {
      expect(Product.create('Poires', 2, 5.5, 1, 0, PRODUCER_ID, CATEGORY_A).unit).toBe('KG');
    });

    it.each(['KG', 'BOTTE', 'PIECE'])("accepte l'unité %s", (unit) => {
      expect(Product.create('Poires', 2, 5.5, 1, 0, PRODUCER_ID, CATEGORY_A, unit).unit).toBe(unit);
    });

    it.each([
      ['nom trop court', () => Product.create('Po', 2, 5.5, 1, 0, PRODUCER_ID, CATEGORY_A, 'KG')],
      ['prix nul', () => Product.create('Poires', 0, 5.5, 1, 0, PRODUCER_ID, CATEGORY_A, 'KG')],
      ['prix négatif', () => Product.create('Poires', -1, 5.5, 1, 0, PRODUCER_ID, CATEGORY_A, 'KG')],
      ['taux de TVA > 100', () => Product.create('Poires', 2, 101, 1, 0, PRODUCER_ID, CATEGORY_A, 'KG')],
      ['taux de TVA négatif', () => Product.create('Poires', 2, -1, 1, 0, PRODUCER_ID, CATEGORY_A, 'KG')],
      ['stock < stock minimum', () => Product.create('Poires', 2, 5.5, 4, 5, PRODUCER_ID, CATEGORY_A, 'KG')],
      ['stock négatif', () => Product.create('Poires', 2, 5.5, -1, 0, PRODUCER_ID, CATEGORY_A, 'KG')],
      ['producerId invalide', () => Product.create('Poires', 2, 5.5, 1, 0, 'pas-un-uuid', CATEGORY_A, 'KG')],
      ['categoryId invalide', () => Product.create('Poires', 2, 5.5, 1, 0, PRODUCER_ID, 'pas-un-uuid', 'KG')],
      ['unité inconnue', () => Product.create('Poires', 2, 5.5, 1, 0, PRODUCER_ID, CATEGORY_A, 'LITRE')],
      ['unité en minuscules', () => Product.create('Poires', 2, 5.5, 1, 0, PRODUCER_ID, CATEGORY_A, 'kg')],
      ['unité vide', () => Product.create('Poires', 2, 5.5, 1, 0, PRODUCER_ID, CATEGORY_A, '')],
    ])('rejette un %s', (_label, create) => {
      expect(create).toThrow(DomainValidationError);
    });
  });

  describe('stock', () => {
    it('réapprovisionne le stock', () => {
      const product = createProduct();

      product.restock(10);

      expect(product.stock).toBe(30);
    });

    it('retire du stock jusqu\'au stock minimum', () => {
      const product = createProduct();

      product.withdrawStock(15);

      expect(product.stock).toBe(5);
    });

    it('refuse un retrait qui passerait sous le stock minimum et conserve le stock', () => {
      const product = createProduct();

      expect(() => product.withdrawStock(16)).toThrow(DomainValidationError);
      expect(product.stock).toBe(20);
    });

    it('change le stock minimum', () => {
      const product = createProduct();

      product.changeMinStock(20);

      expect(product.minStock).toBe(20);
    });

    it('refuse un stock minimum supérieur au stock et conserve la valeur précédente', () => {
      const product = createProduct();

      expect(() => product.changeMinStock(21)).toThrow(DomainValidationError);
      expect(product.minStock).toBe(5);
    });
  });

  describe('modifications', () => {
    it('change nom, prix, TVA, producteur, catégorie et unité', () => {
      const product = createProduct();
      const otherProducer = 'd3bb189e-8bf9-4888-9912-ace4e6543002';

      product.changeName('Pommes Gala');
      product.changePrice(4);
      product.changeVatRate(20);
      product.changeProducer(otherProducer);
      product.changeCategory(CATEGORY_B);
      product.changeUnit('BOTTE');

      expect(product.name).toBe('Pommes Gala');
      expect(product.price).toBe(4);
      expect(product.vatRate).toBe(20);
      expect(product.producerId).toBe(otherProducer);
      expect(product.categoryId).toBe(CATEGORY_B);
      expect(product.unit).toBe('BOTTE');
    });

    it.each([
      ['nom', (p: Product) => p.changeName('ab'), (p: Product) => p.name, 'Pommes Golden'],
      ['prix', (p: Product) => p.changePrice(0), (p: Product) => p.price, 3.5],
      ['taux de TVA', (p: Product) => p.changeVatRate(150), (p: Product) => p.vatRate, 5.5],
      ['producteur', (p: Product) => p.changeProducer('x'), (p: Product) => p.producerId, PRODUCER_ID],
      ['catégorie', (p: Product) => p.changeCategory('x'), (p: Product) => p.categoryId, CATEGORY_A],
      ['unité', (p: Product) => p.changeUnit('LITRE'), (p: Product) => p.unit, 'KG'],
    ])('rejette un %s invalide et conserve la valeur précédente', (_label, change, read, previous) => {
      const product = createProduct();

      expect(() => change(product)).toThrow(DomainValidationError);
      expect(read(product)).toBe(previous);
    });
  });

  describe('reconstitute', () => {
    it("reconstitue un produit à partir de l'état persisté", () => {
      const id = 'e3bb189e-8bf9-4888-9912-ace4e6543002';
      const product = Product.reconstitute(id, 'Poires', 2.2, 5.5, 8, 3, PRODUCER_ID, CATEGORY_B, 'PIECE');

      expect(product.id).toBe(id);
      expect(product.stock).toBe(8);
      expect(product.minStock).toBe(3);
      expect(product.categoryId).toBe(CATEGORY_B);
      expect(product.unit).toBe('PIECE');
    });

    it('rejette une unité persistée inconnue', () => {
      expect(() => Product.reconstitute('e3bb189e-8bf9-4888-9912-ace4e6543002', 'Poires', 2.2, 5.5, 8, 3, PRODUCER_ID, CATEGORY_B, 'LITRE')).toThrow(
        DomainValidationError,
      );
    });

    it('rejette un categoryId persisté invalide', () => {
      expect(() => Product.reconstitute('e3bb189e-8bf9-4888-9912-ace4e6543002', 'Poires', 2.2, 5.5, 8, 3, PRODUCER_ID, 'x', 'KG')).toThrow(
        DomainValidationError,
      );
    });
  });
});
