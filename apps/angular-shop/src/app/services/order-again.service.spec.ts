import type {
    OrderItemResponseDto,
    OrderResponseDto,
    ProductWithProducerResponseDto,
} from '@fpm/contracts';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { CartService } from './cart.service';
import { NotificationService } from './notification.service';
import { OrderAgainService } from './order-again.service';

const FLOUR_ID = 'a3bb189e-8bf9-4888-9912-ace4e6543002';
const PASTA_ID = 'b3bb189e-8bf9-4888-9912-ace4e6543002';
const HONEY_ID = 'c3bb189e-8bf9-4888-9912-ace4e6543002';

const product = (id: string, isAvailable = true): ProductWithProducerResponseDto => ({
    id,
    name: `Produit ${id}`,
    image: 'https://example.com/produit.jpg',
    price: 2.5,
    vatRate: 5.5,
    stock: 10,
    minStock: 1,
    producer: { id: 'producer-1', name: 'Ferme des Lilas' },
    categoryId: 'cat-1',
    unit: 'KG',
    content: null,
    referencePrice: { amount: 2.5, unit: 'kg' },
    isAvailable,
});

const item = (
    productId: string,
    quantity: number,
    confirmedQuantity: number,
): OrderItemResponseDto => ({
    productId,
    productName: `Produit ${productId}`,
    unitPrice: 2.5,
    vatRate: 5.5,
    quantity,
    confirmedQuantity,
    total: 0,
});

const order = (items: OrderItemResponseDto[]): OrderResponseDto => ({
    id: '12345678-1234-4123-8123-123456789abc',
    number: '2026-11-7',
    status: 'COMPLETED',
    isModified: false,
    createdAt: '2026-11-16T11:00:00.000Z',
    estimatedPickupDate: '2026-11-19',
    contact: {
        firstName: 'Paul',
        lastName: 'Martin',
        email: 'paul@example.fr',
        phone: '+33698765432',
    },
    billingAddress: { line1: '2 quai Est', line2: '', postalCode: '29200', city: 'Brest' },
    items,
    subtotal: 0,
    tax: 0,
    total: 0,
});

describe('OrderAgainService', () => {
    let service: OrderAgainService;
    let http: HttpTestingController;
    let cart: CartService;
    let notifications: NotificationService;
    let navigate: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        localStorage.clear();
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                provideRouter([{ path: '**', children: [] }]),
            ],
        });
        service = TestBed.inject(OrderAgainService);
        http = TestBed.inject(HttpTestingController);
        cart = TestBed.inject(CartService);
        notifications = TestBed.inject(NotificationService);
        navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
        vi.spyOn(notifications, 'showSuccess');
        vi.spyOn(notifications, 'showInfo');
        vi.spyOn(notifications, 'showError');
    });

    afterEach(() => {
        http.verify();
        vi.restoreAllMocks();
    });

    /** Lance `orderAgain` et répond à l'appel `/products` avec `products`. */
    const orderAgain = async (
        items: OrderItemResponseDto[],
        products: ProductWithProducerResponseDto[],
    ) => {
        const done = service.orderAgain(order(items));
        const request = http.expectOne((req) => req.url === `${environment.apiUrl}/products`);
        request.flush({ success: true, data: products });
        await done;
        return request.request;
    };

    const cartQuantities = () => cart.items().map((line) => [line.product.id, line.quantity]);

    it('met dans le panier les quantités confirmées par la boutique, pas celles commandées', async () => {
        await orderAgain(
            [item(FLOUR_ID, 3, 1), item(PASTA_ID, 2, 2)],
            [product(FLOUR_ID), product(PASTA_ID)],
        );

        expect(cartQuantities()).toEqual([
            [FLOUR_ID, 1],
            [PASTA_ID, 2],
        ]);
        expect(notifications.showSuccess).toHaveBeenCalledWith('Produits ajoutés au panier');
        expect(navigate).toHaveBeenCalledWith('/panier');
    });

    it('ne demande que les produits gardés par la boutique : un produit retiré est ignoré', async () => {
        const request = await orderAgain(
            [item(FLOUR_ID, 3, 3), item(PASTA_ID, 2, 0)],
            [product(FLOUR_ID)],
        );

        expect(request.params.getAll('productIds')).toEqual([FLOUR_ID]);
        expect(cartQuantities()).toEqual([[FLOUR_ID, 3]]);
        expect(notifications.showSuccess).toHaveBeenCalled();
    });

    it('envoie un seul productIds pour une commande d’un seul produit', async () => {
        const request = await orderAgain([item(FLOUR_ID, 1, 1)], [product(FLOUR_ID)]);

        expect(request.params.getAll('productIds')).toEqual([FLOUR_ID]);
    });

    it('ignore et signale les produits indisponibles ou supprimés du catalogue', async () => {
        await orderAgain(
            [item(FLOUR_ID, 1, 1), item(PASTA_ID, 1, 1), item(HONEY_ID, 1, 1)],
            [product(FLOUR_ID), product(PASTA_ID, false)],
        );

        expect(cartQuantities()).toEqual([[FLOUR_ID, 1]]);
        expect(notifications.showInfo).toHaveBeenCalledWith(
            '1 produit(s) ajouté(s) au panier, 2 indisponible(s)',
        );
        expect(navigate).toHaveBeenCalledWith('/panier');
    });

    it('compte comme indisponible un produit refusé par le panier', async () => {
        cart.addToCart(product(PASTA_ID), 10);

        await orderAgain(
            [item(FLOUR_ID, 1, 1), item(PASTA_ID, 1, 1)],
            [product(FLOUR_ID), product(PASTA_ID)],
        );

        expect(cartQuantities()).toEqual([
            [PASTA_ID, 10],
            [FLOUR_ID, 1],
        ]);
        expect(notifications.showInfo).toHaveBeenCalledWith(
            '1 produit(s) ajouté(s) au panier, 1 indisponible(s)',
        );
    });

    it('reste sur la page et prévient quand aucun produit n’est disponible', async () => {
        await orderAgain([item(FLOUR_ID, 1, 1)], [product(FLOUR_ID, false)]);

        expect(cart.isEmpty()).toBe(true);
        expect(notifications.showError).toHaveBeenCalledWith(
            'Aucun produit de cette commande n’est disponible',
        );
        expect(navigate).not.toHaveBeenCalled();
    });

    it('n’appelle pas l’API quand la boutique a retiré tous les produits', async () => {
        await service.orderAgain(order([item(FLOUR_ID, 1, 0)]));

        http.expectNone(`${environment.apiUrl}/products`);
        expect(notifications.showError).toHaveBeenCalled();
        expect(navigate).not.toHaveBeenCalled();
    });

    it('laisse le panier intact si l’API échoue', async () => {
        const done = service.orderAgain(order([item(FLOUR_ID, 1, 1)]));
        http.expectOne((req) => req.url === `${environment.apiUrl}/products`).flush(null, {
            status: 500,
            statusText: 'Server Error',
        });
        await done;

        expect(cart.isEmpty()).toBe(true);
        expect(notifications.showError).toHaveBeenCalledWith(
            'Impossible de reprendre cette commande pour le moment. Veuillez réessayer.',
        );
        expect(navigate).not.toHaveBeenCalled();
    });
});
