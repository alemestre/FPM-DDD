import { DomainValidationError } from '../../shared/domain/errors/domain-validation.error';
import { Product } from './product.entity';
import type { ProductContentProps } from './value-objects/product-content.value-object';

const IMAGE = 'https://example.com/images/produit.jpg';

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
    Product.create(' Pommes Golden ', 3.5, 5.5, 20, 5, PRODUCER_ID, CATEGORY_A, IMAGE, 'KG');

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
            expect(product.image).toBe(IMAGE);
            expect(product.unit).toBe('KG');
            expect(product.content).toBeNull();
        });

        it.each(['g', 'ml', 'kg', 'l'])("accepte l'unité de mesure %s", (measureUnit) => {
            const product = Product.create(
                'Poires',
                2,
                5.5,
                1,
                0,
                PRODUCER_ID,
                CATEGORY_A,
                IMAGE,
                'PIECE',
                { itemCount: 1, itemSize: { amount: 1.5, unit: measureUnit } },
            );

            expect(product.content?.itemSize?.amount).toBe(1.5);
            expect(product.content?.itemSize?.unit).toBe(measureUnit);
        });

        it("utilise KG quand l'unité n'est pas précisée", () => {
            expect(
                Product.create('Poires', 2, 5.5, 1, 0, PRODUCER_ID, CATEGORY_A, IMAGE).unit,
            ).toBe('KG');
        });

        it.each([
            ['KG', null],
            ['BOTTE', null],
            ['PIECE', null],
            ['DOUZAINE', null],
            ['BOUTEILLE', { itemCount: 1, itemSize: { amount: 1, unit: 'l' } }],
            ['LOT', { itemCount: 4, itemSize: { amount: 125, unit: 'g' } }],
        ])(
            "accepte l'unité %s",
            (unit, content) => {
                expect(
                    Product.create(
                        'Poires',
                        2,
                        5.5,
                        1,
                        0,
                        PRODUCER_ID,
                        CATEGORY_A,
                        IMAGE,
                        unit,
                        content,
                    ).unit,
                ).toBe(unit);
            },
        );

        it.each([
            [
                'nom trop court',
                () => Product.create('Po', 2, 5.5, 1, 0, PRODUCER_ID, CATEGORY_A, IMAGE, 'KG'),
            ],
            [
                'prix nul',
                () => Product.create('Poires', 0, 5.5, 1, 0, PRODUCER_ID, CATEGORY_A, IMAGE, 'KG'),
            ],
            [
                'prix négatif',
                () => Product.create('Poires', -1, 5.5, 1, 0, PRODUCER_ID, CATEGORY_A, IMAGE, 'KG'),
            ],
            [
                'taux de TVA > 100',
                () => Product.create('Poires', 2, 101, 1, 0, PRODUCER_ID, CATEGORY_A, IMAGE, 'KG'),
            ],
            [
                'taux de TVA négatif',
                () => Product.create('Poires', 2, -1, 1, 0, PRODUCER_ID, CATEGORY_A, IMAGE, 'KG'),
            ],
            [
                'stock < stock minimum',
                () => Product.create('Poires', 2, 5.5, 4, 5, PRODUCER_ID, CATEGORY_A, IMAGE, 'KG'),
            ],
            [
                'stock négatif',
                () => Product.create('Poires', 2, 5.5, -1, 0, PRODUCER_ID, CATEGORY_A, IMAGE, 'KG'),
            ],
            [
                'producerId invalide',
                () =>
                    Product.create('Poires', 2, 5.5, 1, 0, 'pas-un-uuid', CATEGORY_A, IMAGE, 'KG'),
            ],
            [
                'categoryId invalide',
                () =>
                    Product.create('Poires', 2, 5.5, 1, 0, PRODUCER_ID, 'pas-un-uuid', IMAGE, 'KG'),
            ],
            [
                'image sans protocole',
                () =>
                    Product.create(
                        'Poires',
                        2,
                        5.5,
                        1,
                        0,
                        PRODUCER_ID,
                        CATEGORY_A,
                        'poires.jpg',
                        'KG',
                    ),
            ],
            [
                'image vide',
                () => Product.create('Poires', 2, 5.5, 1, 0, PRODUCER_ID, CATEGORY_A, '', 'KG'),
            ],
            [
                'unité inconnue',
                () =>
                    Product.create(
                        'Poires',
                        2,
                        5.5,
                        1,
                        0,
                        PRODUCER_ID,
                        CATEGORY_A,
                        IMAGE,
                        'GRAMME',
                    ),
            ],
            [
                'unité en minuscules',
                () => Product.create('Poires', 2, 5.5, 1, 0, PRODUCER_ID, CATEGORY_A, IMAGE, 'kg'),
            ],
            [
                'unité vide',
                () => Product.create('Poires', 2, 5.5, 1, 0, PRODUCER_ID, CATEGORY_A, IMAGE, ''),
            ],
            [
                'unité de mesure inconnue',
                () =>
                    Product.create('Poires', 2, 5.5, 1, 0, PRODUCER_ID, CATEGORY_A, IMAGE, 'PIECE', {
                        itemCount: 1,
                        itemSize: { amount: 1, unit: 'cl' },
                    }),
            ],
            [
                'unité de mesure en majuscules',
                () =>
                    Product.create('Poires', 2, 5.5, 1, 0, PRODUCER_ID, CATEGORY_A, IMAGE, 'PIECE', {
                        itemCount: 1,
                        itemSize: { amount: 1, unit: 'KG' },
                    }),
            ],
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

        it("retire du stock jusqu'au stock minimum", () => {
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
            product.changeImage('https://example.com/images/gala.jpg');
            product.changeUnit('BOTTE');

            expect(product.name).toBe('Pommes Gala');
            expect(product.price).toBe(4);
            expect(product.vatRate).toBe(20);
            expect(product.producerId).toBe(otherProducer);
            expect(product.categoryId).toBe(CATEGORY_B);
            expect(product.image).toBe('https://example.com/images/gala.jpg');
            expect(product.unit).toBe('BOTTE');
        });

        it.each([
            ['nom', (p: Product) => p.changeName('ab'), (p: Product) => p.name, 'Pommes Golden'],
            ['prix', (p: Product) => p.changePrice(0), (p: Product) => p.price, 3.5],
            ['taux de TVA', (p: Product) => p.changeVatRate(150), (p: Product) => p.vatRate, 5.5],
            [
                'producteur',
                (p: Product) => p.changeProducer('x'),
                (p: Product) => p.producerId,
                PRODUCER_ID,
            ],
            [
                'catégorie',
                (p: Product) => p.changeCategory('x'),
                (p: Product) => p.categoryId,
                CATEGORY_A,
            ],
            ['image', (p: Product) => p.changeImage('gala.jpg'), (p: Product) => p.image, IMAGE],
            ['unité', (p: Product) => p.changeUnit('GRAMME'), (p: Product) => p.unit, 'KG'],
            [
                'contenu',
                (p: Product) => p.changeContent({ itemCount: 0, itemSize: null }),
                (p: Product) => p.content,
                null,
            ],
        ])(
            'rejette un %s invalide et conserve la valeur précédente',
            (_label, change, read, previous) => {
                const product = createProduct();

                expect(() => change(product)).toThrow(DomainValidationError);
                expect(read(product)).toBe(previous);
            },
        );
    });

    describe('contenu', () => {
        const create = (unit: string, content: ProductContentProps | null) =>
            Product.create('Poires', 2, 5.5, 1, 0, PRODUCER_ID, CATEGORY_A, IMAGE, unit, content);
        const pieceOf = (amount: number, unit: string): ProductContentProps => ({
            itemCount: 1,
            itemSize: { amount, unit },
        });

        it.each(['KG', 'BOTTE', 'PIECE'])("n'est pas obligatoire pour un produit vendu en %s", (unit) => {
            expect(create(unit, null).content).toBeNull();
        });

        it('accepte un lot de plusieurs articles mesurés', () => {
            const product = create('LOT', { itemCount: 4, itemSize: { amount: 125, unit: 'g' } });

            expect(product.content?.itemCount).toBe(4);
            expect(product.content?.itemSize?.amount).toBe(125);
            expect(product.content?.itemSize?.unit).toBe('g');
        });

        it('donne 12 articles à une douzaine sans contenu', () => {
            const product = create('DOUZAINE', null);

            expect(product.content?.itemCount).toBe(12);
            expect(product.content?.itemSize).toBeNull();
        });

        it.each(['BOUTEILLE', 'LOT'])('est obligatoire pour un produit vendu en %s', (unit) => {
            expect(() => create(unit, null)).toThrow(
                new DomainValidationError(`Un produit vendu en ${unit} doit préciser son contenu`),
            );
        });

        it('refuse un contenu pour un produit vendu au kilo', () => {
            expect(() => create('KG', pieceOf(500, 'g'))).toThrow(DomainValidationError);
        });

        it('définit puis retire le contenu', () => {
            const product = create('PIECE', null);

            product.changeContent(pieceOf(800, 'g'));
            expect(product.content?.itemSize?.amount).toBe(800);

            product.changeContent(null);
            expect(product.content).toBeNull();
        });

        it("refuse de retirer le contenu d'une bouteille et le conserve", () => {
            const product = create('BOUTEILLE', pieceOf(75, 'ml'));

            expect(() => product.changeContent(null)).toThrow(DomainValidationError);
            expect(product.content?.itemSize?.amount).toBe(75);
            expect(product.content?.itemSize?.unit).toBe('ml');
        });

        it("refuse de passer en BOUTEILLE sans contenu et conserve l'unité", () => {
            const product = createProduct();

            expect(() => product.changeUnit('BOUTEILLE')).toThrow(DomainValidationError);
            expect(product.unit).toBe('KG');
        });

        it('passe en BOUTEILLE en conservant le contenu existant', () => {
            const product = create('PIECE', pieceOf(1, 'l'));

            product.changeUnit('BOUTEILLE');

            expect(product.unit).toBe('BOUTEILLE');
            expect(product.content?.itemSize?.amount).toBe(1);
        });

        it("change l'unité de vente et le contenu en une seule étape", () => {
            const product = createProduct();

            product.changeSaleUnit('LOT', { itemCount: 6, itemSize: null });

            expect(product.unit).toBe('LOT');
            expect(product.content?.itemCount).toBe(6);
            expect(product.content?.itemSize).toBeNull();
        });

        it("passe d'un lot au kilo en retirant le contenu dans la même étape", () => {
            const product = create('LOT', pieceOf(500, 'g'));

            expect(() => product.changeUnit('KG')).toThrow(DomainValidationError);
            product.changeSaleUnit('KG', null);

            expect(product.unit).toBe('KG');
            expect(product.content).toBeNull();
        });

        it('ne change rien si le changement atomique est invalide', () => {
            const product = createProduct();

            expect(() => product.changeSaleUnit('BOUTEILLE', { itemCount: 1, itemSize: { amount: 500, unit: 'g' } })).toThrow(
                DomainValidationError,
            );
            expect(product.unit).toBe('KG');
            expect(product.content).toBeNull();
        });
    });

    describe('prix de référence', () => {
        const create = (price: number, unit: string, content: ProductContentProps | null) =>
            Product.create('Poires', price, 5.5, 1, 0, PRODUCER_ID, CATEGORY_A, IMAGE, unit, content);

        it('est le prix lui-même pour un produit vendu au kilo', () => {
            expect(create(3.2, 'KG', null).referencePrice).toEqual({ amount: 3.2, unit: 'kg' });
        });

        it('se calcule au kilo pour un lot (3 € les 4 × 125 g → 6 €/kg)', () => {
            const product = create(3, 'LOT', { itemCount: 4, itemSize: { amount: 125, unit: 'g' } });

            expect(product.referencePrice).toEqual({ amount: 6, unit: 'kg' });
        });

        it('se calcule au litre pour une bouteille (9 € les 75 cl → 12 €/l)', () => {
            const product = create(9, 'BOUTEILLE', { itemCount: 1, itemSize: { amount: 750, unit: 'ml' } });

            expect(product.referencePrice).toEqual({ amount: 12, unit: 'l' });
        });

        it('est arrondi au centime', () => {
            const product = create(2, 'LOT', { itemCount: 1, itemSize: { amount: 300, unit: 'g' } });

            expect(product.referencePrice).toEqual({ amount: 6.67, unit: 'kg' });
        });

        it.each([
            ['BOTTE', null],
            ['PIECE', null],
            ['DOUZAINE', null],
            ['LOT', { itemCount: 6, itemSize: null }],
        ])("n'existe pas en %s sans mesure", (unit, content) => {
            expect(create(2, unit, content).referencePrice).toBeNull();
        });
    });

    describe('reconstitute', () => {
        it("reconstitue un produit à partir de l'état persisté", () => {
            const id = 'e3bb189e-8bf9-4888-9912-ace4e6543002';
            const product = Product.reconstitute(
                id,
                'Poires',
                2.2,
                5.5,
                8,
                3,
                PRODUCER_ID,
                CATEGORY_B,
                IMAGE,
                'PIECE',
            );

            expect(product.id).toBe(id);
            expect(product.stock).toBe(8);
            expect(product.minStock).toBe(3);
            expect(product.categoryId).toBe(CATEGORY_B);
            expect(product.unit).toBe('PIECE');
        });

        it('reconstitue le contenu persisté', () => {
            const product = Product.reconstitute(
                'e3bb189e-8bf9-4888-9912-ace4e6543002',
                'Lait',
                1.2,
                5.5,
                8,
                3,
                PRODUCER_ID,
                CATEGORY_B,
                IMAGE,
                'BOUTEILLE',
                { itemCount: 1, itemSize: { amount: 1, unit: 'l' } },
            );

            expect(product.content?.itemCount).toBe(1);
            expect(product.content?.itemSize?.amount).toBe(1);
            expect(product.content?.itemSize?.unit).toBe('l');
        });

        it('rejette une unité de mesure persistée inconnue', () => {
            expect(() =>
                Product.reconstitute(
                    'e3bb189e-8bf9-4888-9912-ace4e6543002',
                    'Lait',
                    1.2,
                    5.5,
                    8,
                    3,
                    PRODUCER_ID,
                    CATEGORY_B,
                    IMAGE,
                    'BOUTEILLE',
                    { itemCount: 1, itemSize: { amount: 1, unit: 'cl' } },
                ),
            ).toThrow(DomainValidationError);
        });

        it('rejette une bouteille persistée sans contenu', () => {
            expect(() =>
                Product.reconstitute(
                    'e3bb189e-8bf9-4888-9912-ace4e6543002',
                    'Lait',
                    1.2,
                    5.5,
                    8,
                    3,
                    PRODUCER_ID,
                    CATEGORY_B,
                    IMAGE,
                    'BOUTEILLE',
                ),
            ).toThrow(DomainValidationError);
        });

        it('rejette une unité persistée inconnue', () => {
            expect(() =>
                Product.reconstitute(
                    'e3bb189e-8bf9-4888-9912-ace4e6543002',
                    'Poires',
                    2.2,
                    5.5,
                    8,
                    3,
                    PRODUCER_ID,
                    CATEGORY_B,
                    IMAGE,
                    'GRAMME',
                ),
            ).toThrow(DomainValidationError);
        });

        it('rejette un categoryId persisté invalide', () => {
            expect(() =>
                Product.reconstitute(
                    'e3bb189e-8bf9-4888-9912-ace4e6543002',
                    'Poires',
                    2.2,
                    5.5,
                    8,
                    3,
                    PRODUCER_ID,
                    'x',
                    IMAGE,
                    'KG',
                ),
            ).toThrow(DomainValidationError);
        });
    });
});
