import {
    CARROTS_ID,
    cartWith,
    createCartRepositoryMock,
    CUSTOMER_ID,
} from './cart-use-case.test-helpers';
import { ClearCartUseCase } from './clear-cart.use-case';

jest.mock('uuid', () => ({
    v4: jest.fn(() => '12345678-1234-4123-8123-123456789abc'),
    validate: jest.fn(() => true),
}));

const APPLES_ID = 'f3bb189e-8bf9-4888-9912-ace4e6543002';

describe('ClearCartUseCase', () => {
    let carts: ReturnType<typeof createCartRepositoryMock>;
    let useCase: ClearCartUseCase;

    beforeEach(() => {
        carts = createCartRepositoryMock();
        useCase = new ClearCartUseCase(carts);
    });

    it('vide le panier du client et enregistre le panier vide', async () => {
        const cart = cartWith([CARROTS_ID, 1], [APPLES_ID, 2]);
        carts.findByCustomerId.mockResolvedValue(cart);

        await expect(useCase.execute(CUSTOMER_ID)).resolves.toBeUndefined();

        expect(carts.findByCustomerId).toHaveBeenCalledWith(CUSTOMER_ID);
        expect(cart.lines).toEqual([]);
        expect(carts.save).toHaveBeenCalledWith(cart);
    });

    it("ne fait rien si le client n'a pas de panier", async () => {
        carts.findByCustomerId.mockResolvedValue(null);

        await expect(useCase.execute(CUSTOMER_ID)).resolves.toBeUndefined();
        expect(carts.save).not.toHaveBeenCalled();
    });

    it('ne fait rien si le panier est déjà vide', async () => {
        carts.findByCustomerId.mockResolvedValue(cartWith());

        await expect(useCase.execute(CUSTOMER_ID)).resolves.toBeUndefined();
        expect(carts.save).not.toHaveBeenCalled();
    });
});
