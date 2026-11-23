import { DomainValidationError } from '../../../shared/domain/errors/domain-validation.error';
import {
    CARROTS_ID,
    carrots,
    cartWith,
    createCartRepositoryMock,
    createProductRepositoryMock,
    CUSTOMER_ID,
    quantities,
    withProducer,
} from './cart-use-case.test-helpers';
import { AddCartItemUseCase } from './add-cart-item.use-case';
import { NotFoundException } from '@nestjs/common';

jest.mock('uuid', () => ({
    v4: jest.fn(() => '12345678-1234-4123-8123-123456789abc'),
    validate: jest.fn(() => true),
}));

describe('AddCartItemUseCase', () => {
    let carts: ReturnType<typeof createCartRepositoryMock>;
    let products: ReturnType<typeof createProductRepositoryMock>;
    let useCase: AddCartItemUseCase;

    beforeEach(() => {
        carts = createCartRepositoryMock();
        products = createProductRepositoryMock();
        products.findById.mockResolvedValue(carrots());
        useCase = new AddCartItemUseCase(carts, products);
    });

    it('crée le panier au premier produit et le renvoie avec ses produits', async () => {
        const product = withProducer(carrots());
        products.findManyWithProducer.mockResolvedValue([product]);

        const result = await useCase.execute(CUSTOMER_ID, CARROTS_ID, 2);

        expect(carts.customerExists).toHaveBeenCalledWith(CUSTOMER_ID);
        expect(carts.save).toHaveBeenCalledWith(result.cart);
        expect(result.cart.customerId).toBe(CUSTOMER_ID);
        expect(quantities(result.cart)).toEqual([[CARROTS_ID, 2]]);
        expect(result.products).toEqual([product]);
    });

    it('additionne la quantité à celle du panier existant', async () => {
        carts.findByCustomerId.mockResolvedValue(cartWith([CARROTS_ID, 1]));

        const { cart } = await useCase.execute(CUSTOMER_ID, CARROTS_ID, 3);

        expect(quantities(cart)).toEqual([[CARROTS_ID, 4]]);
        expect(carts.customerExists).not.toHaveBeenCalled();
    });

    it('refuse une quantité totale supérieure au stock, sans enregistrer', async () => {
        carts.findByCustomerId.mockResolvedValue(cartWith([CARROTS_ID, 3]));

        await expect(useCase.execute(CUSTOMER_ID, CARROTS_ID, 2)).rejects.toThrow(
            new DomainValidationError('Stock insuffisant pour "Carottes" : 4 disponible(s)'),
        );
        expect(carts.save).not.toHaveBeenCalled();
    });

    it('refuse un produit inconnu', async () => {
        products.findById.mockResolvedValue(null);

        await expect(useCase.execute(CUSTOMER_ID, CARROTS_ID, 1)).rejects.toThrow(
            DomainValidationError,
        );
        expect(carts.save).not.toHaveBeenCalled();
    });

    it('refuse un produit indisponible', async () => {
        products.findById.mockResolvedValue(carrots({ isAvailable: false }));

        await expect(useCase.execute(CUSTOMER_ID, CARROTS_ID, 1)).rejects.toThrow(
            new DomainValidationError('Le produit "Carottes" n\'est plus disponible'),
        );
    });

    it("répond 404 à un utilisateur sans profil client", async () => {
        carts.customerExists.mockResolvedValue(false);

        await expect(useCase.execute(CUSTOMER_ID, CARROTS_ID, 1)).rejects.toThrow(
            NotFoundException,
        );
        expect(carts.save).not.toHaveBeenCalled();
    });
});
