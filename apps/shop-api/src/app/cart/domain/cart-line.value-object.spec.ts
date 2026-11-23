import { DomainValidationError } from '../../shared/domain/errors/domain-validation.error';
import { CartLine } from './cart-line.value-object';

describe('CartLine', () => {
    it.each([1, 10])('accepte la quantité %p', (quantity) => {
        expect(CartLine.create('product', quantity).quantity).toBe(quantity);
    });

    it.each([0, 11, -2, 2.5, Number.NaN])('refuse la quantité %p', (quantity) => {
        expect(() => CartLine.create('product', quantity)).toThrow(DomainValidationError);
    });

    it('withQuantity donne une nouvelle ligne sans changer la première', () => {
        const line = CartLine.create('product', 2);
        const changed = line.withQuantity(5);

        expect(changed.quantity).toBe(5);
        expect(changed.productId).toBe('product');
        expect(line.quantity).toBe(2);
    });
});
