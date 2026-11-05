import { DomainValidationError } from '../../../shared/domain/errors/domain-validation.error';
import { Stock } from './stock.value-object';

describe('Stock', () => {
  describe('create', () => {
    it('accepte un stock égal au stock minimum', () => {
      const stock = Stock.create(5, 5);

      expect(stock.quantity).toBe(5);
      expect(stock.minimum).toBe(5);
    });

    it('rejette un stock inférieur au stock minimum', () => {
      expect(() => Stock.create(4, 5)).toThrow(
        'Le stock (4) ne peut pas être inférieur au stock minimum (5)',
      );
    });

    it.each([
      [-1, 0],
      [1.5, 0],
      [10, -1],
      [10, 2.5],
    ])('rejette des valeurs non entières ou négatives (%p, %p)', (quantity, minimum) => {
      expect(() => Stock.create(quantity, minimum)).toThrow(DomainValidationError);
    });
  });

  describe('mouvements', () => {
    it('augmente le stock sans modifier l\'instance d\'origine', () => {
      const stock = Stock.create(10, 2);

      const increased = stock.increase(5);

      expect(increased.quantity).toBe(15);
      expect(increased.minimum).toBe(2);
      expect(stock.quantity).toBe(10);
    });

    it('diminue le stock jusqu\'au minimum inclus', () => {
      expect(Stock.create(10, 2).decrease(8).quantity).toBe(2);
    });

    it('refuse une diminution qui passerait sous le stock minimum', () => {
      expect(() => Stock.create(10, 2).decrease(9)).toThrow(DomainValidationError);
    });

    it('refuse une diminution supérieure au stock disponible', () => {
      expect(() => Stock.create(3, 0).decrease(4)).toThrow(DomainValidationError);
    });

    it.each([0, -1, 1.5])('refuse un mouvement de %p unité(s)', (quantity) => {
      const stock = Stock.create(10, 2);

      expect(() => stock.increase(quantity)).toThrow(DomainValidationError);
      expect(() => stock.decrease(quantity)).toThrow(DomainValidationError);
    });
  });

  describe('withMinimum', () => {
    it('change le stock minimum', () => {
      expect(Stock.create(10, 2).withMinimum(10).minimum).toBe(10);
    });

    it('refuse un stock minimum supérieur au stock actuel', () => {
      expect(() => Stock.create(10, 2).withMinimum(11)).toThrow(DomainValidationError);
    });
  });

  it('compare par valeur', () => {
    expect(Stock.create(10, 2).equals(Stock.create(10, 2))).toBe(true);
    expect(Stock.create(10, 2).equals(Stock.create(10, 3))).toBe(false);
  });
});
