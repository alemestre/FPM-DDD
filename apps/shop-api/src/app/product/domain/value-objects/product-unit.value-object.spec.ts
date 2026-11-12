import { DomainValidationError } from '../../../shared/domain/errors/domain-validation.error';
import { ProductContent, type ProductContentProps } from './product-content.value-object';
import { ProductUnit } from './product-unit.value-object';

const content = (props: ProductContentProps) => ProductContent.create(props);
const resolve = (unit: string, props: ProductContentProps | null) =>
    ProductUnit.create(unit).resolveContent(props === null ? null : content(props));

describe('ProductUnit', () => {
    it.each(['KG', 'BOTTE', 'PIECE', 'DOUZAINE', 'BOUTEILLE', 'LOT'])('accepte %p', (value) => {
        expect(ProductUnit.create(value).value).toBe(value);
    });

    it.each(['', 'kg', 'GRAMME', 'LITRE', 'CONDITIONNEMENT', ' KG'])('rejette %p', (value) => {
        expect(() => ProductUnit.create(value)).toThrow(DomainValidationError);
    });

    it.each([
        ['KG', true, false, null],
        ['BOTTE', false, false, null],
        ['PIECE', false, false, null],
        ['DOUZAINE', false, false, 12],
        ['BOUTEILLE', false, true, null],
        ['LOT', false, true, null],
    ])(
        '%s : au poids %p, contenu obligatoire %p, articles imposés %p',
        (value, byWeight, requiresContent, fixed) => {
            const unit = ProductUnit.create(value);

            expect(unit.isSoldByWeight()).toBe(byWeight);
            expect(unit.requiresContent()).toBe(requiresContent);
            expect(unit.fixedItemCount()).toBe(fixed);
        },
    );

    describe('resolveContent', () => {
        describe('KG', () => {
            it('n’a pas de contenu', () => {
                expect(resolve('KG', null)).toBeNull();
            });

            it('refuse un contenu : le prix est au kilo', () => {
                expect(() =>
                    resolve('KG', { itemCount: 1, itemSize: { amount: 500, unit: 'g' } }),
                ).toThrow(
                    new DomainValidationError(
                        "Un produit vendu au kilo n'a pas de contenu : son prix est au kilo",
                    ),
                );
            });
        });

        describe.each(['BOTTE', 'PIECE'])('%s', (unit) => {
            it('accepte de ne pas avoir de contenu', () => {
                expect(resolve(unit, null)).toBeNull();
            });

            it('accepte un contenu indicatif', () => {
                expect(
                    resolve(unit, { itemCount: 1, itemSize: { amount: 800, unit: 'g' } })?.itemSize
                        ?.amount,
                ).toBe(800);
            });
        });

        describe('DOUZAINE', () => {
            it('contient 12 articles quand aucun contenu n’est donné', () => {
                const resolved = resolve('DOUZAINE', null);

                expect(resolved?.itemCount).toBe(12);
                expect(resolved?.itemSize).toBeNull();
            });

            it('accepte 12 articles mesurés', () => {
                expect(
                    resolve('DOUZAINE', { itemCount: 12, itemSize: { amount: 60, unit: 'g' } })
                        ?.itemCount,
                ).toBe(12);
            });

            it('refuse un autre nombre d’articles', () => {
                expect(() => resolve('DOUZAINE', { itemCount: 6, itemSize: null })).toThrow(
                    new DomainValidationError('Un produit vendu en DOUZAINE contient 12 articles'),
                );
            });
        });

        describe('BOUTEILLE', () => {
            it.each([
                [750, 'ml'],
                [1, 'l'],
            ])('accepte une bouteille de %p %s', (amount, unit) => {
                expect(
                    resolve('BOUTEILLE', { itemCount: 1, itemSize: { amount, unit } })?.itemSize
                        ?.unit,
                ).toBe(unit);
            });

            it('exige un contenu', () => {
                expect(() => resolve('BOUTEILLE', null)).toThrow(
                    new DomainValidationError(
                        'Un produit vendu en BOUTEILLE doit préciser son contenu',
                    ),
                );
            });

            it.each([
                ['plusieurs articles', { itemCount: 6, itemSize: { amount: 1, unit: 'l' } }],
                ['un poids', { itemCount: 1, itemSize: { amount: 500, unit: 'g' } }],
                ['des articles sans mesure', { itemCount: 2, itemSize: null }],
            ])('refuse %s', (_label, props) => {
                expect(() => resolve('BOUTEILLE', props)).toThrow(
                    new DomainValidationError(
                        'Une bouteille contient un seul article mesuré en ml ou en l',
                    ),
                );
            });
        });

        describe('LOT', () => {
            it.each([
                ['4 × 125 g', { itemCount: 4, itemSize: { amount: 125, unit: 'g' } }],
                ['1 × 500 g', { itemCount: 1, itemSize: { amount: 500, unit: 'g' } }],
                ['6 articles sans mesure', { itemCount: 6, itemSize: null }],
            ])('accepte %s', (_label, props) => {
                expect(resolve('LOT', props)?.itemCount).toBe(props.itemCount);
            });

            it('exige un contenu', () => {
                expect(() => resolve('LOT', null)).toThrow(
                    new DomainValidationError('Un produit vendu en LOT doit préciser son contenu'),
                );
            });
        });
    });

    it('compare par valeur', () => {
        expect(ProductUnit.create('KG').equals(ProductUnit.create('KG'))).toBe(true);
        expect(ProductUnit.create('KG').equals(ProductUnit.create('PIECE'))).toBe(false);
    });
});
