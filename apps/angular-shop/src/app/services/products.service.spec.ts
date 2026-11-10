import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { ProductsService } from './products.service';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

describe('ProductsService', () => {
  let service: ProductsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ProductsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getProductsByCategoryId filtre /products par categoryId et renvoie la liste déballée', async () => {
    const products = [{ id: 'p-1', categoryId: 'cat-1' }];

    const result = firstValueFrom(service.getProductsByCategoryId('cat-1'));
    const request = http.expectOne(
      (req) => req.url === `${environment.apiUrl}/products` && req.params.get('categoryId') === 'cat-1',
    );
    expect(request.request.method).toBe('GET');
    request.flush({ success: true, data: products });

    await expect(result).resolves.toEqual(products);
  });
});
