import {
    CARROTS_ID,
    cartWith,
    createCartRepositoryMock,
    createProductRepositoryMock,
    CUSTOMER_ID,
} from './cart-use-case.test-helpers';
import { RemoveCartItemUseCase } from './remove-cart-item.use-case';
import { NotFoundException } from '@nestjs/common';

jest.mock('uuid', () => ({
    v4: jest.fn(() => '12345678-1234-4123-8123-123456789abc'),
    validate: jest.fn(() => true),
}));

const APPLES_ID = 'f3bb189e-8bf9-4888-9912-ace4e6543002';

describe('RemoveCartItemUseCase', () => {
    let carts: ReturnType<typeof createCartRepositoryMock>;
    let products: ReturnType<typeof createProductRepositoryMock>;
    let useCase: RemoveCartItemUseCase;

    beforeEach(() => {
        carts = createCartRepositoryMock();
        products = createProductRepositoryMock();
        useCase = new RemoveCartItemUseCase(carts, products);
    });

    it('retire le produit et enregistre le panier', async () => {
        carts.findByCustomerId.mockResolvedValue(cartWith([CARROTS_ID, 1], [APPLES_ID, 2]));

        const { cart } = await useCase.execute(CUSTOMER_ID, CARROTS_ID);

        expect(cart.has(CARROTS_ID)).toBe(false);
        expect(cart.has(APPLES_ID)).toBe(true);
        expect(carts.save).toHaveBeenCalledWith(cart);
        expect(products.findById).not.toHaveBeenCalled();
    });

    it("ne lit pas tout le catalogue quand le panier devient vide", async () => {
        carts.findByCustomerId.mockResolvedValue(cartWith([CARROTS_ID, 1]));

        const { products: found } = await useCase.execute(CUSTOMER_ID, CARROTS_ID);

        expect(found).toEqual([]);
        expect(products.findManyWithProducer).not.toHaveBeenCalled();
    });

    it("répond 404 si le produit n'est pas dans le panier", async () => {
        carts.findByCustomerId.mockResolvedValue(cartWith([APPLES_ID, 1]));

        await expect(useCase.execute(CUSTOMER_ID, CARROTS_ID)).rejects.toThrow(NotFoundException);
        expect(carts.save).not.toHaveBeenCalled();
    });

    it("répond 404 si le client n'a pas de panier", async () => {
        await expect(useCase.execute(CUSTOMER_ID, CARROTS_ID)).rejects.toThrow(NotFoundException);
    });
});
