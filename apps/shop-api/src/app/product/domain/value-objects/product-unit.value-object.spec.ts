import { DomainValidationError } from '../../../shared/domain/errors/domain-validation.error';
import { ProductUnit } from './product-unit.value-object';

describe('ProductUnit', () => {
  it.each(['KG', 'BOTTE', 'PIECE', 'CONDITIONNEMENT', 'BOUTEILLE'])('accepte %p', (value) => {
    expect(ProductUnit.create(value).value).toBe(value);
  });

  it.each(['', 'kg', 'GRAMME', 'LITRE', ' KG'])('rejette %p', (value) => {
    expect(() => ProductUnit.create(value)).toThrow(DomainValidationError);
  });

  it.each([
    ['CONDITIONNEMENT', true],
    ['BOUTEILLE', true],
    ['KG', false],
    ['BOTTE', false],
    ['PIECE', false],
  ])('%s exige une quantité : %p', (value, expected) => {
    expect(ProductUnit.create(value).requiresQuantity()).toBe(expected);
  });

  it('compare par valeur', () => {
    expect(ProductUnit.create('KG').equals(ProductUnit.create('KG'))).toBe(true);
    expect(ProductUnit.create('KG').equals(ProductUnit.create('PIECE'))).toBe(false);
  });
});
