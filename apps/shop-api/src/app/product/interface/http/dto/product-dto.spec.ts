import { CreateProductSchema } from './create-product.dto';
import { StockMovementSchema } from './stock-movement.dto';
import { UpdateProductSchema } from './update-product.dto';

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

    it.each([
      ['prix nul', { price: 0 }],
      ['prix en texte', { price: '3.5' }],
      ['TVA > 100', { vatRate: 101 }],
      ['stock décimal', { stock: 1.5 }],
      ['stock minimum négatif', { minStock: -1 }],
      ['producerId non UUID', { producerId: 'abc' }],
      ['categoryId non UUID', { categoryId: 'abc' }],
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
});
