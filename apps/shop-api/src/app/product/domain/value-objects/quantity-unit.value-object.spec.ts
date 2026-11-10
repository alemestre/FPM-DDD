import { DomainValidationError } from '../../../shared/domain/errors/domain-validation.error';
import { QuantityUnit } from './quantity-unit.value-object';

describe('QuantityUnit', () => {
  it.each(['pcs', 'g', 'ml', 'kg', 'l'])('accepte %p', (value) => {
    expect(QuantityUnit.create(value).value).toBe(value);
  });

  it.each(['', 'KG', 'L', 'cl', ' g'])('rejette %p', (value) => {
    expect(() => QuantityUnit.create(value)).toThrow(DomainValidationError);
  });

  it('compare par valeur', () => {
    expect(QuantityUnit.create('g').equals(QuantityUnit.create('g'))).toBe(true);
    expect(QuantityUnit.create('g').equals(QuantityUnit.create('kg'))).toBe(false);
  });
});
