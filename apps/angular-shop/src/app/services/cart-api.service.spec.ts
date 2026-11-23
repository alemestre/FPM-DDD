import type { ProductWithProducerResponseDto } from '@fpm/contracts';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { CartApiService } from './cart-api.service';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

const CART_URL = `${environment.apiUrl}/cart`;
const ITEMS_URL = `${environment.apiUrl}/cart/items`;
const PRODUCT_ID = 'a3bb189e-8bf9-4888-9912-ace4e6543002';

const product = { id: PRODUCT_ID, name: 'Carottes' } as ProductWithProducerResponseDto;
const cartResponse = { success: true, data: { items: [{ product, quantity: 2 }] } };

describe('CartApiService', () => {
    let service: CartApiService;
    let http: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()],
        });
        service = TestBed.inject(CartApiService);
        http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => http.verify());

    it('load lit GET /cart avec la session et renvoie les lignes', async () => {
        const items = firstValueFrom(service.load());

        const request = http.expectOne(CART_URL);
        expect(request.request.method).toBe('GET');
        expect(request.request.withCredentials).toBe(true);
        request.flush(cartResponse);

        await expect(items).resolves.toEqual([{ product, quantity: 2 }]);
    });

    it('add envoie POST /cart/items avec le produit et la quantité', async () => {
        const items = firstValueFrom(service.add(PRODUCT_ID, 2));

        const request = http.expectOne(ITEMS_URL);
        expect(request.request.method).toBe('POST');
        expect(request.request.body).toEqual({ productId: PRODUCT_ID, quantity: 2 });
        expect(request.request.withCredentials).toBe(true);
        request.flush(cartResponse);

        await expect(items).resolves.toEqual([{ product, quantity: 2 }]);
    });

    it('changeQuantity envoie PATCH /cart/items/:productId avec la quantité', async () => {
        const items = firstValueFrom(service.changeQuantity(PRODUCT_ID, 2));

        const request = http.expectOne(`${ITEMS_URL}/${PRODUCT_ID}`);
        expect(request.request.method).toBe('PATCH');
        expect(request.request.body).toEqual({ quantity: 2 });
        expect(request.request.withCredentials).toBe(true);
        request.flush(cartResponse);

        await expect(items).resolves.toEqual([{ product, quantity: 2 }]);
    });

    it('remove envoie DELETE /cart/items/:productId', async () => {
        const items = firstValueFrom(service.remove(PRODUCT_ID));

        const request = http.expectOne(`${ITEMS_URL}/${PRODUCT_ID}`);
        expect(request.request.method).toBe('DELETE');
        expect(request.request.withCredentials).toBe(true);
        request.flush({ success: true, data: { items: [] } });

        await expect(items).resolves.toEqual([]);
    });

    it('clear envoie DELETE /cart/items et accepte une réponse 204', async () => {
        const done = firstValueFrom(service.clear(), { defaultValue: undefined });

        const request = http.expectOne(ITEMS_URL);
        expect(request.request.method).toBe('DELETE');
        expect(request.request.withCredentials).toBe(true);
        request.flush(null, { status: 204, statusText: 'No Content' });

        await expect(done).resolves.toBeNull();
    });
});
