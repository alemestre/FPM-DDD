import type { ProductRepository, ProductWithProducer } from '../../../product/domain/product.repository';
import type { CartRepository } from '../../domain/cart.repository';
import { Product } from '../../../product/domain/product.entity';
import { CartLine } from '../../domain/cart-line.value-object';
import { Cart } from '../../domain/cart.entity';

export const CUSTOMER_ID = '3f0c9a52-8a6e-4c1b-9d57-2b1e7f4a6c10';
export const CART_ID = 'c3bb189e-8bf9-4888-9912-ace4e6543002';
export const CARROTS_ID = 'e3bb189e-8bf9-4888-9912-ace4e6543002';
const PRODUCER_ID = 'a3bb189e-8bf9-4888-9912-ace4e6543002';
const CATEGORY_ID = 'b3bb189e-8bf9-4888-9912-ace4e6543002';

/** Carrots, 4 in stock unless told otherwise. */
export const carrots = ({ stock = 4, isAvailable = true } = {}): Product =>
    Product.reconstitute(
        CARROTS_ID,
        'Carottes',
        2.5,
        5.5,
        stock,
        0,
        PRODUCER_ID,
        CATEGORY_ID,
        'https://example.com/carottes.jpg',
        'KG',
        null,
        isAvailable,
    );

export const withProducer = (product: Product): ProductWithProducer => ({
    product,
    producer: { id: PRODUCER_ID, name: 'Ferme des Lilas' },
});

export const cartWith = (...lines: [string, number][]): Cart =>
    Cart.restore({
        id: CART_ID,
        customerId: CUSTOMER_ID,
        lines: lines.map(([productId, quantity]) => CartLine.create(productId, quantity)),
    });

export const createCartRepositoryMock = (): jest.Mocked<CartRepository> => ({
    findByCustomerId: jest.fn().mockResolvedValue(null),
    save: jest.fn().mockResolvedValue(undefined),
    customerExists: jest.fn().mockResolvedValue(true),
});

export const createProductRepositoryMock = (): jest.Mocked<ProductRepository> =>
    ({
        save: jest.fn(),
        findById: jest.fn(),
        findByIdOrFail: jest.fn(),
        findAll: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findManyWithProducer: jest.fn().mockResolvedValue([]),
        findByIdWithProducerOrFail: jest.fn(),
    }) as jest.Mocked<ProductRepository>;

export const quantities = (cart: Cart) => cart.lines.map((line) => [line.productId, line.quantity]);
