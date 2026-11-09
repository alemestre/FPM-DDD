import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
    let http: HttpClient;
    let httpTesting: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()],
        });
        http = TestBed.inject(HttpClient);
        httpTesting = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpTesting.verify());

    it.each(['/api/login', '/api/me', '/api/logout', '/api/revoke-token'])(
        'laisse passer le 401 de %s sans tenter de rafraîchir le jeton',
        async (url) => {
            const request = firstValueFrom(http.post(url, {}));

            httpTesting.expectOne(url).flush(null, { status: 401, statusText: 'Unauthorized' });

            await expect(request).rejects.toMatchObject({ status: 401 });
            httpTesting.expectNone('/api/revoke-token');
        },
    );

    it('tente de rafraîchir le jeton sur le 401 d’un autre appel', async () => {
        const request = firstValueFrom(http.get('/api/orders'));

        httpTesting.expectOne('/api/orders').flush(null, { status: 401, statusText: 'Unauthorized' });
        httpTesting.expectOne('/api/revoke-token').flush({});
        httpTesting.expectOne('/api/orders').flush({ ok: true });

        await expect(request).resolves.toEqual({ ok: true });
    });
});
