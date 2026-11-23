import { DomainValidationError } from '../../../shared/domain/errors/domain-validation.error';
import {
    CARROTS_ID,
    carrots,
    cartWith,
    createCartRepositoryMock,
    createProductRepositoryMock,
    CUSTOMER_ID,
    quantities,
} from './cart-use-case.test-helpers';
import { ChangeCartItemQuantityUseCase } from './change-cart-item-quantity.use-case';
import { NotFoundException } from '@nestjs/common';

jest.mock('uuid', () => ({
    v4: jest.fn(() => '12345678-1234-4123-8123-123456789abc'),
    validate: jest.fn(() => true),
}));

describe('ChangeCartItemQuantityUseCase', () => {
    let carts: ReturnType<typeof createCartRepositoryMock>;
    let products: ReturnType<typeof createProductRepositoryMock>;
    let useCase: ChangeCartItemQuantityUseCase;

    beforeEach(() => {
        carts = createCartRepositoryMock();
        carts.findByCustomerId.mockResolvedValue(cartWith([CARROTS_ID, 1]));
        products = createProductRepositoryMock();
        products.findById.mockResolvedValue(carrots());
        useCase = new ChangeCartItemQuantityUseCase(carts, products);
    });

    it('remplace la quantité et enregistre le panier', async () => {
        const { cart } = await useCase.execute(CUSTOMER_ID, CARROTS_ID, 4);

        expect(quantities(cart)).toEqual([[CARROTS_ID, 4]]);
        expect(carts.save).toHaveBeenCalledWith(cart);
    });

    it('refuse une quantité supérieure au stock actuel, sans enregistrer', async () => {
        products.findById.mockResolvedValue(carrots({ stock: 2 }));

        await expect(useCase.execute(CUSTOMER_ID, CARROTS_ID, 3)).rejects.toThrow(
            DomainValidationError,
        );
        expect(carts.save).not.toHaveBeenCalled();
    });

    it("répond 404 si le produit n'est pas dans le panier", async () => {
        carts.findByCustomerId.mockResolvedValue(cartWith());

        await expect(useCase.execute(CUSTOMER_ID, CARROTS_ID, 2)).rejects.toThrow(
            NotFoundException,
        );
        expect(products.findById).not.toHaveBeenCalled();
    });

    it("répond 404 si le client n'a pas de panier", async () => {
        carts.findByCustomerId.mockResolvedValue(null);

        await expect(useCase.execute(CUSTOMER_ID, CARROTS_ID, 2)).rejects.toThrow(
            NotFoundException,
        );
    });
});
