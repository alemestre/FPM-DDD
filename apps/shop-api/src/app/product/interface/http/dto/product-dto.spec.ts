import { CreateProductSchema } from './create-product.dto';
import { StockMovementSchema } from './stock-movement.dto';
import { UpdateProductSchema } from './update-product.dto';
import { ListProductsQuerySchema } from './list-products-query.dto';

const PRODUCER_ID = 'a3bb189e-8bf9-4888-9912-ace4e6543002';
const CATEGORY_ID = 'b3bb189e-8bf9-4888-9912-ace4e6543002';

const validProduct = {
  name: 'Pommes Golden',
  price: 3.5,
  vatRate: 5.5,
  stock: 20,
  minStock: 5,
  producerId: PRODUCER_ID,
  categoryId: CATEGORY_ID,
  unit: 'KG',
};

describe('Product schemas', () => {
  describe('CreateProductSchema', () => {
    it('accepte un produit valide', () => {
      expect(CreateProductSchema.safeParse(validProduct).success).toBe(true);
    });

    it.each(['name', 'price', 'vatRate', 'stock', 'minStock', 'producerId', 'categoryId'])(
      'rejette un produit sans %s',
      (property) => {
        const product: Record<string, unknown> = { ...validProduct };
        delete product[property];

        expect(CreateProductSchema.safeParse(product).success).toBe(false);
      },
    );

    it("accepte un produit sans unité sans lui imposer de valeur (le domaine applique KG)", () => {
      const parsed = CreateProductSchema.parse({ ...validProduct, unit: undefined });

      expect(parsed.unit).toBeUndefined();
    });

    it.each([0.75, 500, null])('accepte une quantité de %p', (quantity) => {
      expect(CreateProductSchema.safeParse({ ...validProduct, quantity }).success).toBe(true);
    });

    it.each(['pcs', 'g', 'ml', 'kg', 'l', null])("accepte l'unité de quantité %p", (quantityUnit) => {
      expect(CreateProductSchema.safeParse({ ...validProduct, quantityUnit }).success).toBe(true);
    });

    it.each([
      ['prix nul', { price: 0 }],
      ['prix en texte', { price: '3.5' }],
      ['TVA > 100', { vatRate: 101 }],
      ['stock décimal', { stock: 1.5 }],
      ['stock minimum négatif', { minStock: -1 }],
      ['producerId non UUID', { producerId: 'abc' }],
      ['categoryId non UUID', { categoryId: 'abc' }],
      ['unité inconnue', { unit: 'GRAMME' }],
      ['unité en minuscules', { unit: 'kg' }],
      ['quantité nulle', { quantity: 0 }],
      ['quantité négative', { quantity: -1 }],
      ['quantité en texte', { quantity: '500' }],
      ['unité de quantité inconnue', { quantityUnit: 'cl' }],
      ['unité de quantité en majuscules', { quantityUnit: 'KG' }],
    ])('rejette un %s', (_label, override) => {
      expect(CreateProductSchema.safeParse({ ...validProduct, ...override }).success).toBe(false);
    });
  });

  describe('UpdateProductSchema', () => {
    it('accepte une mise à jour partielle', () => {
      expect(UpdateProductSchema.safeParse({ price: 4 }).success).toBe(true);
      expect(UpdateProductSchema.safeParse({}).success).toBe(true);
    });

    it("n'ajoute pas de valeur par défaut", () => {
      expect(UpdateProductSchema.parse({ price: 4 })).toEqual({ price: 4 });
    });

    it('accepte un changement de catégorie et rejette un categoryId non UUID', () => {
      expect(UpdateProductSchema.safeParse({ categoryId: CATEGORY_ID }).success).toBe(true);
      expect(UpdateProductSchema.safeParse({ categoryId: 'abc' }).success).toBe(false);
    });

    it("refuse l'ancien champ categoryIds", () => {
      expect(UpdateProductSchema.safeParse({ categoryIds: [CATEGORY_ID] }).success).toBe(false);
    });

    it.each(['KG', 'BOTTE', 'PIECE', 'CONDITIONNEMENT', 'BOUTEILLE'])("accepte l'unité %s", (unit) => {
      expect(UpdateProductSchema.safeParse({ unit }).success).toBe(true);
    });

    it("accepte un changement d'unité et rejette une unité inconnue", () => {
      expect(UpdateProductSchema.safeParse({ unit: 'BOTTE' }).success).toBe(true);
      expect(UpdateProductSchema.safeParse({ unit: 'GRAMME' }).success).toBe(false);
    });

    it('accepte de retirer la quantité avec null', () => {
      expect(UpdateProductSchema.parse({ quantity: null, quantityUnit: null })).toEqual({
        quantity: null,
        quantityUnit: null,
      });
    });

    it('refuse de modifier le stock directement', () => {
      expect(UpdateProductSchema.safeParse({ stock: 10 }).success).toBe(false);
    });
  });

  describe('StockMovementSchema', () => {
    it.each([0, -1, 1.5])('rejette une quantité de %p', (quantity) => {
      expect(StockMovementSchema.safeParse({ quantity }).success).toBe(false);
    });

    it('accepte une quantité entière positive', () => {
      expect(StockMovementSchema.safeParse({ quantity: 3 }).success).toBe(true);
    });
  });

  describe('ListProductsQuerySchema', () => {
    it('accepte une query sans filtre', () => {
      expect(ListProductsQuerySchema.safeParse({}).success).toBe(true);
    });

    it('accepte un categoryId UUID', () => {
      expect(ListProductsQuerySchema.parse({ categoryId: CATEGORY_ID })).toEqual({ categoryId: CATEGORY_ID });
    });

    it("refuse un categoryId qui n'est pas un UUID", () => {
      expect(ListProductsQuerySchema.safeParse({ categoryId: 'abc' }).success).toBe(false);
    });
  });
});
