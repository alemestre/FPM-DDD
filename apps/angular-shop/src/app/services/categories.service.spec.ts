import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { CategoriesService } from './categories.service';
import { TestBed } from '@angular/core/testing';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(CategoriesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  const settle = () => TestBed.inject(ApplicationRef).whenStable();

  it('allCategoriesResource appelle /categories', async () => {
    const categories = [{ id: 'cat-1', name: 'Fruits & Légumes', slug: 'fruits-legumes' }];

    const resource = TestBed.runInInjectionContext(() => service.allCategoriesResource());
    TestBed.tick();
    const request = http.expectOne(`${environment.apiUrl}/categories`);
    expect(request.request.method).toBe('GET');
    request.flush({ success: true, data: categories });
    await settle();

    expect(resource.value()?.data).toEqual(categories);
  });

  it('categoryBySlugResource appelle /categories/slug/:slug et recharge quand le slug change', async () => {
    const slug = signal<string | null>('fruits-legumes');
    const category = { id: 'cat-1', name: 'Fruits & Légumes', slug: 'fruits-legumes' };

    const resource = TestBed.runInInjectionContext(() => service.categoryBySlugResource(slug));
    TestBed.tick();
    http.expectOne(`${environment.apiUrl}/categories/slug/fruits-legumes`).flush({ success: true, data: category });
    await settle();
    expect(resource.value()?.data).toEqual(category);

    slug.set('pâtes & riz');
    TestBed.tick();
    http.expectOne(`${environment.apiUrl}/categories/slug/p%C3%A2tes%20%26%20riz`);
  });

  it("categoryBySlugResource n'envoie aucune requête sans slug", () => {
    const resource = TestBed.runInInjectionContext(() => service.categoryBySlugResource(signal(null)));
    TestBed.tick();

    expect(resource.status()).toBe('idle');
  });
});
