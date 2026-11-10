import { DomainValidationError } from '../../../shared/domain/errors/domain-validation.error';
import { ProductQuantity } from './product-quantity.value-object';

describe('ProductQuantity', () => {
  it('crée une quantité décimale avec son unité', () => {
    const quantity = ProductQuantity.create(0.75, 'l');

    expect(quantity.amount).toBe(0.75);
    expect(quantity.unit).toBe('l');
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])('rejette une quantité de %p', (amount) => {
    expect(() => ProductQuantity.create(amount, 'g')).toThrow(DomainValidationError);
  });

  it('rejette une unité inconnue', () => {
    expect(() => ProductQuantity.create(1, 'cl')).toThrow(DomainValidationError);
  });

  describe('fromNullable', () => {
    it("renvoie null quand ni la quantité ni l'unité ne sont fournies", () => {
      expect(ProductQuantity.fromNullable(null, null)).toBeNull();
    });

    it('crée la quantité quand les deux sont fournies', () => {
      expect(ProductQuantity.fromNullable(500, 'g')?.amount).toBe(500);
    });

    it.each([
      [500, null],
      [null, 'g'],
    ])('refuse %p avec %p : les deux vont ensemble', (amount, unit) => {
      expect(() => ProductQuantity.fromNullable(amount, unit)).toThrow(
        new DomainValidationError('La quantité et son unité doivent être renseignées ensemble'),
      );
    });
  });

  it('compare par valeur', () => {
    expect(ProductQuantity.create(1, 'kg').equals(ProductQuantity.create(1, 'kg'))).toBe(true);
    expect(ProductQuantity.create(1, 'kg').equals(ProductQuantity.create(1, 'l'))).toBe(false);
    expect(ProductQuantity.create(1, 'kg').equals(ProductQuantity.create(2, 'kg'))).toBe(false);
  });
});
