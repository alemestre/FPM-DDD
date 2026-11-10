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
      expect(product.quantity).toBeNull();
      expect(product.quantityUnit).toBeNull();
    });

    it.each(['pcs', 'g', 'ml', 'kg', 'l'])("accepte l'unité de quantité %s", (quantityUnit) => {
      const product = Product.create('Poires', 2, 5.5, 1, 0, PRODUCER_ID, CATEGORY_A, 'KG', 1.5, quantityUnit);

      expect(product.quantity).toBe(1.5);
      expect(product.quantityUnit).toBe(quantityUnit);
    });

    it("utilise KG quand l'unité n'est pas précisée", () => {
      expect(Product.create('Poires', 2, 5.5, 1, 0, PRODUCER_ID, CATEGORY_A).unit).toBe('KG');
    });

    it.each(['KG', 'BOTTE', 'PIECE', 'CONDITIONNEMENT', 'BOUTEILLE'])("accepte l'unité %s", (unit) => {
      expect(Product.create('Poires', 2, 5.5, 1, 0, PRODUCER_ID, CATEGORY_A, unit, 1, 'kg').unit).toBe(unit);
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
      ['unité inconnue', () => Product.create('Poires', 2, 5.5, 1, 0, PRODUCER_ID, CATEGORY_A, 'GRAMME')],
      ['unité en minuscules', () => Product.create('Poires', 2, 5.5, 1, 0, PRODUCER_ID, CATEGORY_A, 'kg')],
      ['unité vide', () => Product.create('Poires', 2, 5.5, 1, 0, PRODUCER_ID, CATEGORY_A, '')],
      ['unité de quantité inconnue', () => Product.create('Poires', 2, 5.5, 1, 0, PRODUCER_ID, CATEGORY_A, 'KG', 1, 'cl')],
      ['unité de quantité en majuscules', () => Product.create('Poires', 2, 5.5, 1, 0, PRODUCER_ID, CATEGORY_A, 'KG', 1, 'KG')],
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
      ['unité', (p: Product) => p.changeUnit('GRAMME'), (p: Product) => p.unit, 'KG'],
      ['unité de quantité', (p: Product) => p.changeQuantity(1, 'cl'), (p: Product) => p.quantityUnit, null],
      ['quantité', (p: Product) => p.changeQuantity(0, 'g'), (p: Product) => p.quantity, null],
    ])('rejette un %s invalide et conserve la valeur précédente', (_label, change, read, previous) => {
      const product = createProduct();

      expect(() => change(product)).toThrow(DomainValidationError);
      expect(read(product)).toBe(previous);
    });
  });

  describe('quantité', () => {
    const create = (unit: string, quantity: number | null, quantityUnit: string | null) =>
      Product.create('Poires', 2, 5.5, 1, 0, PRODUCER_ID, CATEGORY_A, unit, quantity, quantityUnit);

    it.each(['KG', 'BOTTE', 'PIECE'])('est facultative pour un produit vendu en %s', (unit) => {
      const product = create(unit, null, null);

      expect(product.quantity).toBeNull();
      expect(product.quantityUnit).toBeNull();
    });

    it('accepte le poids ou le volume d\'une pièce', () => {
      const product = create('PIECE', 250, 'g');

      expect(product.quantity).toBe(250);
      expect(product.quantityUnit).toBe('g');
    });

    it.each([
      ['CONDITIONNEMENT', 500, 'g'],
      ['BOUTEILLE', 0.75, 'l'],
    ])('accepte un produit vendu en %s avec sa quantité', (unit, quantity, quantityUnit) => {
      const product = create(unit, quantity, quantityUnit);

      expect(product.quantity).toBe(quantity);
      expect(product.quantityUnit).toBe(quantityUnit);
    });

    it.each(['CONDITIONNEMENT', 'BOUTEILLE'])('est obligatoire pour un produit vendu en %s', (unit) => {
      expect(() => create(unit, null, null)).toThrow(
        new DomainValidationError(`Un produit vendu en ${unit} doit avoir une quantité et une unité de quantité`),
      );
    });

    it.each([
      ['KG', 1, null],
      ['PIECE', null, 'g'],
      ['CONDITIONNEMENT', 500, null],
      ['BOUTEILLE', null, 'l'],
    ])('refuse en %s une quantité sans unité ou une unité sans quantité (%p, %p)', (unit, quantity, quantityUnit) => {
      expect(() => create(unit, quantity, quantityUnit)).toThrow(
        new DomainValidationError('La quantité et son unité doivent être renseignées ensemble'),
      );
    });

    it.each([0, -1, Number.NaN])('refuse une quantité de %p', (quantity) => {
      expect(() => create('PIECE', quantity, 'g')).toThrow(DomainValidationError);
    });

    it('définit puis retire la quantité', () => {
      const product = createProduct();

      product.changeQuantity(1.5, 'kg');
      expect(product.quantity).toBe(1.5);
      expect(product.quantityUnit).toBe('kg');

      product.changeQuantity(null, null);
      expect(product.quantity).toBeNull();
      expect(product.quantityUnit).toBeNull();
    });

    it("refuse de retirer la quantité d'une bouteille et la conserve", () => {
      const product = create('BOUTEILLE', 75, 'ml');

      expect(() => product.changeQuantity(null, null)).toThrow(DomainValidationError);
      expect(product.quantity).toBe(75);
      expect(product.quantityUnit).toBe('ml');
    });

    it("refuse de passer en BOUTEILLE sans quantité et conserve l'unité", () => {
      const product = createProduct();

      expect(() => product.changeUnit('BOUTEILLE')).toThrow(DomainValidationError);
      expect(product.unit).toBe('KG');
    });

    it('passe en BOUTEILLE en conservant la quantité existante', () => {
      const product = createProduct();
      product.changeQuantity(1, 'l');

      product.changeUnit('BOUTEILLE');

      expect(product.unit).toBe('BOUTEILLE');
      expect(product.quantity).toBe(1);
    });

    it("change l'unité de vente et la quantité en une seule étape", () => {
      const product = createProduct();

      product.changeSaleUnit('CONDITIONNEMENT', 6, 'pcs');

      expect(product.unit).toBe('CONDITIONNEMENT');
      expect(product.quantity).toBe(6);
      expect(product.quantityUnit).toBe('pcs');
    });

    it('ne change rien si le changement atomique est invalide', () => {
      const product = createProduct();

      expect(() => product.changeSaleUnit('BOUTEILLE', 75, null)).toThrow(DomainValidationError);
      expect(product.unit).toBe('KG');
      expect(product.quantity).toBeNull();
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

    it("reconstitue l'unité de quantité persistée", () => {
      const product = Product.reconstitute('e3bb189e-8bf9-4888-9912-ace4e6543002', 'Lait', 1.2, 5.5, 8, 3, PRODUCER_ID, CATEGORY_B, 'BOUTEILLE', 1, 'l');

      expect(product.quantity).toBe(1);
      expect(product.quantityUnit).toBe('l');
    });

    it('rejette une unité de quantité persistée inconnue', () => {
      expect(() => Product.reconstitute('e3bb189e-8bf9-4888-9912-ace4e6543002', 'Lait', 1.2, 5.5, 8, 3, PRODUCER_ID, CATEGORY_B, 'BOUTEILLE', 1, 'cl')).toThrow(
        DomainValidationError,
      );
    });

    it('rejette une bouteille persistée sans quantité', () => {
      expect(() => Product.reconstitute('e3bb189e-8bf9-4888-9912-ace4e6543002', 'Lait', 1.2, 5.5, 8, 3, PRODUCER_ID, CATEGORY_B, 'BOUTEILLE')).toThrow(
        DomainValidationError,
      );
    });

    it('rejette une unité persistée inconnue', () => {
      expect(() => Product.reconstitute('e3bb189e-8bf9-4888-9912-ace4e6543002', 'Poires', 2.2, 5.5, 8, 3, PRODUCER_ID, CATEGORY_B, 'GRAMME')).toThrow(
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
