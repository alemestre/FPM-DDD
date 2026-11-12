import { DomainValidationError } from '../../../shared/domain/errors/domain-validation.error';
import { ProductContent } from './product-content.value-object';

describe('ProductContent', () => {
    it('crée un lot de plusieurs articles mesurés (4 × 125 g)', () => {
        const content = ProductContent.create({
            itemCount: 4,
            itemSize: { amount: 125, unit: 'g' },
        });

        expect(content.itemCount).toBe(4);
        expect(content.itemSize?.amount).toBe(125);
        expect(content.itemSize?.unit).toBe('g');
    });

    it('crée plusieurs articles sans mesure (12 œufs)', () => {
        expect(ProductContent.create({ itemCount: 12, itemSize: null }).itemSize).toBeNull();
    });

    it('crée un seul article mesuré (1 × 750 ml)', () => {
        expect(
            ProductContent.create({ itemCount: 1, itemSize: { amount: 750, unit: 'ml' } })
                .itemCount,
        ).toBe(1);
    });

    it.each([0, -1, 1.5, Number.NaN])('rejette un nombre d’articles de %p', (itemCount) => {
        expect(() =>
            ProductContent.create({ itemCount, itemSize: { amount: 1, unit: 'g' } }),
        ).toThrow(
            new DomainValidationError(
                "Le nombre d'articles doit être un entier supérieur ou égal à 1",
            ),
        );
    });

    it('rejette un seul article sans mesure : le contenu ne dirait rien', () => {
        expect(() => ProductContent.create({ itemCount: 1, itemSize: null })).toThrow(
            new DomainValidationError("Un contenu d'un seul article doit préciser sa mesure"),
        );
    });

    it('rejette une mesure invalide', () => {
        expect(() =>
            ProductContent.create({ itemCount: 2, itemSize: { amount: 1, unit: 'pcs' } }),
        ).toThrow(DomainValidationError);
        expect(() =>
            ProductContent.create({ itemCount: 2, itemSize: { amount: 0, unit: 'g' } }),
        ).toThrow(DomainValidationError);
    });

    describe('fromNullable', () => {
        it('renvoie null sans contenu', () => {
            expect(ProductContent.fromNullable(null)).toBeNull();
        });

        it('crée le contenu quand il est fourni', () => {
            expect(ProductContent.fromNullable({ itemCount: 6, itemSize: null })?.itemCount).toBe(
                6,
            );
        });
    });

    describe('totalInReferenceUnit', () => {
        it.each([
            [4, 125, 'g', 0.5, 'kg'],
            [1, 750, 'ml', 0.75, 'l'],
            [6, 1, 'l', 6, 'l'],
        ])('%p × %p %s = %p %s', (itemCount, amount, unit, expectedAmount, expectedUnit) => {
            const content = ProductContent.create({ itemCount, itemSize: { amount, unit } });

            expect(content.totalInReferenceUnit()).toEqual({
                amount: expectedAmount,
                unit: expectedUnit,
            });
        });

        it('renvoie null quand les articles ne sont pas mesurés', () => {
            expect(
                ProductContent.create({ itemCount: 12, itemSize: null }).totalInReferenceUnit(),
            ).toBeNull();
        });
    });

    it('compare par valeur', () => {
        const lot = (itemCount: number, amount: number | null) =>
            ProductContent.create({
                itemCount,
                itemSize: amount === null ? null : { amount, unit: 'g' },
            });

        expect(lot(4, 125).equals(lot(4, 125))).toBe(true);
        expect(lot(12, null).equals(lot(12, null))).toBe(true);
        expect(lot(4, 125).equals(lot(6, 125))).toBe(false);
        expect(lot(4, 125).equals(lot(4, 100))).toBe(false);
        expect(lot(4, 125).equals(lot(4, null))).toBe(false);
    });
});
