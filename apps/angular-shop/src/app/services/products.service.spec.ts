import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { ProductsService } from './products.service';
import { TestBed } from '@angular/core/testing';

describe('ProductsService', () => {
  let service: ProductsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ProductsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  const settle = () => TestBed.inject(ApplicationRef).whenStable();

  it('availableProductsResource filtre /products sur isAvailable', async () => {
    const products = [{ id: 'p-1' }];

    const resource = TestBed.runInInjectionContext(() => service.availableProductsResource());
    TestBed.tick();
    const request = http.expectOne(
      (req) => req.url === `${environment.apiUrl}/products` && req.params.get('isAvailable') === 'true',
    );
    expect(request.request.method).toBe('GET');
    request.flush({ success: true, data: products });
    await settle();

    expect(resource.value()?.data).toEqual(products);
  });

  it('activeProductsByCategoryResource ne demande que les produits disponibles', () => {
    TestBed.runInInjectionContext(() => service.activeProductsByCategoryResource(signal('cat-1')));
    TestBed.tick();

    const request = http.expectOne((req) => req.url === `${environment.apiUrl}/products`);
    expect(request.request.params.get('isAvailable')).toBe('true');
    expect(request.request.params.has('isActive')).toBe(false);
  });

  it('activeProductsByCategoryResource filtre /products par categoryId et recharge quand il change', async () => {
    const categoryId = signal('cat-1');
    const products = [{ id: 'p-1', categoryId: 'cat-1' }];
    const byCategory = (id: string) => (req: { url: string; params: { get(name: string): string | null } }) =>
      req.url === `${environment.apiUrl}/products` && req.params.get('categoryId') === id;

    const resource = TestBed.runInInjectionContext(() => service.activeProductsByCategoryResource(categoryId));
    TestBed.tick();
    http.expectOne(byCategory('cat-1')).flush({ success: true, data: products });
    await settle();
    expect(resource.value()?.data).toEqual(products);

    categoryId.set('cat-2');
    TestBed.tick();
    http.expectOne(byCategory('cat-2'));
  });
});
