import {
    CARROTS_ID,
    carrots,
    cartWith,
    createCartRepositoryMock,
    createProductRepositoryMock,
    CUSTOMER_ID,
    withProducer,
} from './cart-use-case.test-helpers';
import { GetCartUseCase } from './get-cart.use-case';

jest.mock('uuid', () => ({
    v4: jest.fn(() => '12345678-1234-4123-8123-123456789abc'),
    validate: jest.fn(() => true),
}));

describe('GetCartUseCase', () => {
    let carts: ReturnType<typeof createCartRepositoryMock>;
    let products: ReturnType<typeof createProductRepositoryMock>;
    let useCase: GetCartUseCase;

    beforeEach(() => {
        carts = createCartRepositoryMock();
        products = createProductRepositoryMock();
        useCase = new GetCartUseCase(carts, products);
    });

    it('renvoie le panier du client avec ses produits', async () => {
        const cart = cartWith([CARROTS_ID, 2]);
        const product = withProducer(carrots());
        carts.findByCustomerId.mockResolvedValue(cart);
        products.findManyWithProducer.mockResolvedValue([product]);

        await expect(useCase.execute(CUSTOMER_ID)).resolves.toEqual({ cart, products: [product] });
        expect(carts.findByCustomerId).toHaveBeenCalledWith(CUSTOMER_ID);
        expect(products.findManyWithProducer).toHaveBeenCalledWith({ productIds: [CARROTS_ID] });
    });

    it("renvoie un panier vide sans l'enregistrer ni lire tout le catalogue", async () => {
        const { cart, products: found } = await useCase.execute(CUSTOMER_ID);

        expect(cart.customerId).toBe(CUSTOMER_ID);
        expect(cart.lines).toEqual([]);
        expect(found).toEqual([]);
        expect(carts.save).not.toHaveBeenCalled();
        expect(products.findManyWithProducer).not.toHaveBeenCalled();
    });
});
