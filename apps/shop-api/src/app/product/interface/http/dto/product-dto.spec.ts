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
  image: 'https://example.com/images/pommes.jpg',
  unit: 'KG',
};

describe('Product schemas', () => {
  describe('CreateProductSchema', () => {
    it('accepte un produit valide', () => {
      expect(CreateProductSchema.safeParse(validProduct).success).toBe(true);
    });

    it.each(['name', 'price', 'vatRate', 'stock', 'minStock', 'producerId', 'categoryId', 'image'])(
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

    it.each([
      ['4 × 125 g', { itemCount: 4, itemSize: { amount: 125, unit: 'g' } }],
      ['1 × 0,75 l', { itemCount: 1, itemSize: { amount: 0.75, unit: 'l' } }],
      ['12 articles sans mesure', { itemCount: 12, itemSize: null }],
      ['aucun contenu', null],
    ])('accepte le contenu %s', (_label, content) => {
      expect(CreateProductSchema.safeParse({ ...validProduct, content }).success).toBe(true);
    });

    it.each(['g', 'ml', 'kg', 'l'])("accepte l'unité de mesure %p", (unit) => {
      expect(
        CreateProductSchema.safeParse({ ...validProduct, content: { itemCount: 1, itemSize: { amount: 1, unit } } }).success,
      ).toBe(true);
    });

    it('met la mesure à null quand elle est omise', () => {
      expect(CreateProductSchema.parse({ ...validProduct, content: { itemCount: 12 } }).content).toEqual({
        itemCount: 12,
        itemSize: null,
      });
    });

    it.each([
      ['prix nul', { price: 0 }],
      ['prix en texte', { price: '3.5' }],
      ['TVA > 100', { vatRate: 101 }],
      ['stock décimal', { stock: 1.5 }],
      ['stock minimum négatif', { minStock: -1 }],
      ['producerId non UUID', { producerId: 'abc' }],
      ['categoryId non UUID', { categoryId: 'abc' }],
      ['image qui n\'est pas une URL', { image: 'pommes.jpg' }],
      ['image en ftp', { image: 'ftp://example.com/pommes.jpg' }],
      ['unité inconnue', { unit: 'GRAMME' }],
      ['unité en minuscules', { unit: 'kg' }],
      ['nombre d\'articles nul', { content: { itemCount: 0, itemSize: null } }],
      ['nombre d\'articles décimal', { content: { itemCount: 1.5, itemSize: null } }],
      ['contenu sans nombre d\'articles', { content: { itemSize: { amount: 1, unit: 'g' } } }],
      ['mesure nulle', { content: { itemCount: 1, itemSize: { amount: 0, unit: 'g' } } }],
      ['mesure en texte', { content: { itemCount: 1, itemSize: { amount: '500', unit: 'g' } } }],
      ['unité de mesure pcs', { content: { itemCount: 1, itemSize: { amount: 1, unit: 'pcs' } } }],
      ['unité de mesure en majuscules', { content: { itemCount: 1, itemSize: { amount: 1, unit: 'KG' } } }],
      ['champ inconnu dans le contenu', { content: { itemCount: 4, itemSize: null, total: 500 } }],
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

    it("accepte un changement d'image et rejette une image qui n'est pas une URL", () => {
      expect(UpdateProductSchema.safeParse({ image: 'https://example.com/images/gala.jpg' }).success).toBe(true);
      expect(UpdateProductSchema.safeParse({ image: 'gala.jpg' }).success).toBe(false);
    });

    it('accepte un changement de catégorie et rejette un categoryId non UUID', () => {
      expect(UpdateProductSchema.safeParse({ categoryId: CATEGORY_ID }).success).toBe(true);
      expect(UpdateProductSchema.safeParse({ categoryId: 'abc' }).success).toBe(false);
    });

    it("refuse l'ancien champ categoryIds", () => {
      expect(UpdateProductSchema.safeParse({ categoryIds: [CATEGORY_ID] }).success).toBe(false);
    });

    it.each(['KG', 'BOTTE', 'PIECE', 'DOUZAINE', 'BOUTEILLE', 'LOT'])("accepte l'unité %s", (unit) => {
      expect(UpdateProductSchema.safeParse({ unit }).success).toBe(true);
    });

    it("accepte un changement d'unité et rejette une unité inconnue", () => {
      expect(UpdateProductSchema.safeParse({ unit: 'BOTTE' }).success).toBe(true);
      expect(UpdateProductSchema.safeParse({ unit: 'GRAMME' }).success).toBe(false);
    });

    it('accepte de retirer le contenu avec null', () => {
      expect(UpdateProductSchema.parse({ content: null })).toEqual({ content: null });
    });

    it.each(['CONDITIONNEMENT', 'LITRE'])("rejette l'unité retirée %s", (unit) => {
      expect(UpdateProductSchema.safeParse({ unit }).success).toBe(false);
    });

    it("refuse l'ancien format de quantité", () => {
      expect(UpdateProductSchema.safeParse({ contentQuantity: 500, quantityUnit: 'g' }).success).toBe(false);
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
