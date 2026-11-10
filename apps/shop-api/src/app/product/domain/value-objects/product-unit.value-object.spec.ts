import { DomainValidationError } from '../../../shared/domain/errors/domain-validation.error';
import { ProductUnit } from './product-unit.value-object';

describe('ProductUnit', () => {
  it.each(['KG', 'BOTTE', 'PIECE'])('accepte %p', (value) => {
    expect(ProductUnit.create(value).value).toBe(value);
  });

  it.each(['', 'kg', 'LITRE', ' KG'])('rejette %p', (value) => {
    expect(() => ProductUnit.create(value)).toThrow(DomainValidationError);
  });

  it('compare par valeur', () => {
    expect(ProductUnit.create('KG').equals(ProductUnit.create('KG'))).toBe(true);
    expect(ProductUnit.create('KG').equals(ProductUnit.create('PIECE'))).toBe(false);
  });
});
