import { DomainValidationError } from '../../shared/domain/errors/domain-validation.error';
import { CartLineNotFoundError } from './cart-line-not-found.error';
import { CartLine } from './cart-line.value-object';
import { Cart, type CartProduct, MAX_CART_LINES } from './cart.entity';

jest.mock('uuid', () => ({
    v4: jest.fn(() => '12345678-1234-4123-8123-123456789abc'),
    validate: jest.fn(() => true),
}));

const CUSTOMER_ID = '3f0c9a52-8a6e-4c1b-9d57-2b1e7f4a6c10';
const carrots: CartProduct = { id: 'a3bb189e-8bf9-4888-9912-ace4e6543002', name: 'Carottes', stock: 4 };
const apples: CartProduct = { id: 'b3bb189e-8bf9-4888-9912-ace4e6543002', name: 'Pommes', stock: 20 };

const quantities = (cart: Cart) => cart.lines.map((line) => [line.productId, line.quantity]);

describe('Cart', () => {
    it('createFor donne un panier vide au client', () => {
        const cart = Cart.createFor(CUSTOMER_ID);

        expect(cart.id).toBe('12345678-1234-4123-8123-123456789abc');
        expect(cart.customerId).toBe(CUSTOMER_ID);
        expect(cart.lines).toEqual([]);
    });

    describe('add', () => {
        it('ajoute une ligne pour un nouveau produit, à la fin', () => {
            const cart = Cart.createFor(CUSTOMER_ID);
            cart.add(apples, 2);
            cart.add(carrots, 1);

            expect(quantities(cart)).toEqual([
                [apples.id, 2],
                [carrots.id, 1],
            ]);
        });

        it('additionne les quantités quand le produit est déjà dans le panier', () => {
            const cart = Cart.createFor(CUSTOMER_ID);
            cart.add(apples, 2);
            cart.add(apples, 3);

            expect(quantities(cart)).toEqual([[apples.id, 5]]);
        });

        it('accepte une quantité égale au stock', () => {
            const cart = Cart.createFor(CUSTOMER_ID);
            cart.add(carrots, 4);

            expect(quantities(cart)).toEqual([[carrots.id, 4]]);
        });

        it('refuse une quantité supérieure au stock', () => {
            const cart = Cart.createFor(CUSTOMER_ID);

            expect(() => cart.add(carrots, 5)).toThrow(
                new DomainValidationError('Stock insuffisant pour "Carottes" : 4 disponible(s)'),
            );
            expect(cart.lines).toEqual([]);
        });

        it('refuse un ajout dont la somme dépasse le stock, sans changer la ligne', () => {
            const cart = Cart.createFor(CUSTOMER_ID);
            cart.add(carrots, 3);

            expect(() => cart.add(carrots, 2)).toThrow(DomainValidationError);
            expect(quantities(cart)).toEqual([[carrots.id, 3]]);
        });

        it('refuse un produit en rupture de stock', () => {
            const cart = Cart.createFor(CUSTOMER_ID);

            expect(() => cart.add({ ...carrots, stock: 0 }, 1)).toThrow(
                new DomainValidationError('Stock insuffisant pour "Carottes" : 0 disponible(s)'),
            );
        });

        it('refuse plus de 10 unités du même produit, même en stock', () => {
            const cart = Cart.createFor(CUSTOMER_ID);
            cart.add(apples, 6);

            expect(() => cart.add(apples, 5)).toThrow(DomainValidationError);
            expect(quantities(cart)).toEqual([[apples.id, 6]]);
        });

        it.each([0, -1, 1.5])('refuse la quantité %p', (quantity) => {
            expect(() => Cart.createFor(CUSTOMER_ID).add(apples, quantity)).toThrow(
                DomainValidationError,
            );
        });

        it(`refuse un ${MAX_CART_LINES + 1}e produit, mais accepte d'augmenter une ligne existante`, () => {
            const lines = Array.from({ length: MAX_CART_LINES }, (_, index) =>
                CartLine.create(`product-${index}`, 1),
            );
            const cart = Cart.restore({ id: 'cart', customerId: CUSTOMER_ID, lines });

            expect(() => cart.add(apples, 1)).toThrow(DomainValidationError);
            cart.add({ id: 'product-0', name: 'Produit 0', stock: 10 }, 1);
            expect(cart.lines[0].quantity).toBe(2);
        });
    });

    describe('changeQuantity', () => {
        it('remplace la quantité du produit', () => {
            const cart = Cart.createFor(CUSTOMER_ID);
            cart.add(apples, 2);
            cart.changeQuantity(apples, 7);

            expect(quantities(cart)).toEqual([[apples.id, 7]]);
        });

        it('accepte une quantité égale au stock et refuse le stock + 1', () => {
            const cart = Cart.createFor(CUSTOMER_ID);
            cart.add(carrots, 1);

            cart.changeQuantity(carrots, 4);
            expect(() => cart.changeQuantity(carrots, 5)).toThrow(DomainValidationError);
            expect(quantities(cart)).toEqual([[carrots.id, 4]]);
        });

        it('refuse plus de 10 unités', () => {
            const cart = Cart.createFor(CUSTOMER_ID);
            cart.add(apples, 1);

            expect(() => cart.changeQuantity(apples, 11)).toThrow(DomainValidationError);
        });

        it("lève CartLineNotFoundError pour un produit absent du panier", () => {
            expect(() => Cart.createFor(CUSTOMER_ID).changeQuantity(apples, 1)).toThrow(
                CartLineNotFoundError,
            );
        });
    });

    describe('clear', () => {
        it('retire tous les produits', () => {
            const cart = Cart.createFor(CUSTOMER_ID);
            cart.add(apples, 1);
            cart.add(carrots, 2);
            cart.clear();

            expect(cart.lines).toEqual([]);
            expect(cart.has(apples.id)).toBe(false);
        });

        it('laisse vide un panier déjà vide', () => {
            const cart = Cart.createFor(CUSTOMER_ID);
            cart.clear();

            expect(cart.lines).toEqual([]);
        });
    });

    describe('remove', () => {
        it('retire le produit et garde les autres', () => {
            const cart = Cart.createFor(CUSTOMER_ID);
            cart.add(apples, 1);
            cart.add(carrots, 1);
            cart.remove(apples.id);

            expect(quantities(cart)).toEqual([[carrots.id, 1]]);
            expect(cart.has(apples.id)).toBe(false);
        });

        it("lève CartLineNotFoundError pour un produit absent du panier", () => {
            expect(() => Cart.createFor(CUSTOMER_ID).remove(apples.id)).toThrow(
                CartLineNotFoundError,
            );
        });
    });
});
