import { DomainValidationError } from '../errors/domain-validation.error';
import { Quantity } from './quantity.value-object';

describe('Quantity', () => {
  it.each([0, 1, 42])('accepte %p', (value) => {
    expect(Quantity.create(value).value).toBe(value);
  });

  it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])('rejette %p', (value) => {
    expect(() => Quantity.create(value)).toThrow(DomainValidationError);
  });

  it('additionne et soustrait', () => {
    const ten = Quantity.create(10);

    expect(ten.add(Quantity.create(5)).value).toBe(15);
    expect(ten.subtract(Quantity.create(10)).value).toBe(0);
  });

  it('refuse une soustraction qui rendrait la quantité négative', () => {
    expect(() => Quantity.create(3).subtract(Quantity.create(4))).toThrow(DomainValidationError);
  });

  it('compare par valeur', () => {
    expect(Quantity.create(2).equals(Quantity.create(2))).toBe(true);
    expect(Quantity.create(2).isLessThan(Quantity.create(3))).toBe(true);
    expect(Quantity.create(3).isLessThan(Quantity.create(3))).toBe(false);
  });
});
