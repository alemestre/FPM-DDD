import { DomainValidationError } from '../../../shared/domain/errors/domain-validation.error';
import { Measure } from './measure.value-object';

describe('Measure', () => {
    it.each(['g', 'kg', 'ml', 'l'])('accepte l’unité %p', (unit) => {
        expect(Measure.create(1, unit).unit).toBe(unit);
    });

    it('accepte une mesure décimale', () => {
        expect(Measure.create(0.75, 'l').amount).toBe(0.75);
    });

    it.each(['', 'pcs', 'cl', 'KG', ' g'])('rejette l’unité %p', (unit) => {
        expect(() => Measure.create(1, unit)).toThrow(DomainValidationError);
    });

    it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])('rejette une mesure de %p', (amount) => {
        expect(() => Measure.create(amount, 'g')).toThrow(DomainValidationError);
    });

    it.each([
        ['ml', true],
        ['l', true],
        ['g', false],
        ['kg', false],
    ])('%s est un volume : %p', (unit, expected) => {
        expect(Measure.create(1, unit).isVolume()).toBe(expected);
    });

    it.each([
        [125, 'g', 0.125, 'kg'],
        [2, 'kg', 2, 'kg'],
        [750, 'ml', 0.75, 'l'],
        [1, 'l', 1, 'l'],
    ])('convertit %p %s en %p %s', (amount, unit, expectedAmount, expectedUnit) => {
        expect(Measure.create(amount, unit).toReferenceUnit()).toEqual({
            amount: expectedAmount,
            unit: expectedUnit,
        });
    });

    it('compare par valeur', () => {
        expect(Measure.create(1, 'kg').equals(Measure.create(1, 'kg'))).toBe(true);
        expect(Measure.create(1, 'kg').equals(Measure.create(1, 'l'))).toBe(false);
        expect(Measure.create(1, 'kg').equals(Measure.create(2, 'kg'))).toBe(false);
    });
});
