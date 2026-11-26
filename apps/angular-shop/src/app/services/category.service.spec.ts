import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { CategoryService } from './category.service';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

describe('CategoriesService', () => {
  let service: CategoryService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(CategoryService);
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

  describe('espace admin', () => {
    const adminUrl = `${environment.apiUrl}/admin/categories`;
    const category = { id: 'b3bb189e-8bf9-4888-9912-ace4e6543002', name: 'Fruits', slug: 'fruits' };

    it('adminEntitiesResource appelle GET /admin/categories avec le cookie de session', async () => {
      const resource = TestBed.runInInjectionContext(() => service.adminEntitiesResource());
      TestBed.tick();
      const request = http.expectOne(adminUrl);
      expect(request.request.method).toBe('GET');
      expect(request.request.withCredentials).toBe(true);
      request.flush({ success: true, data: [category] });
      await settle();

      expect(resource.value()?.data).toEqual([category]);
    });

    it("adminEntityResource appelle GET /admin/categories/:id, et rien sans id", () => {
      const id = signal<string | null>(null);
      const resource = TestBed.runInInjectionContext(() => service.adminEntityResource(id));
      TestBed.tick();
      expect(resource.status()).toBe('idle');

      id.set(category.id);
      TestBed.tick();
      const request = http.expectOne(`${adminUrl}/${category.id}`);
      expect(request.request.withCredentials).toBe(true);
    });

    it('createEntity envoie POST /admin/categories avec { name }', async () => {
      const result = firstValueFrom(service.createEntity({ name: 'Fruits' }));
      const request = http.expectOne(adminUrl);
      expect(request.request.method).toBe('POST');
      expect(request.request.body).toEqual({ name: 'Fruits' });
      expect(request.request.withCredentials).toBe(true);
      request.flush({ success: true, data: category });

      await expect(result).resolves.toEqual(category);
    });

    it('updateEntity envoie PATCH /admin/categories/:id avec { name }', async () => {
      const result = firstValueFrom(service.updateEntity(category.id, { name: 'Légumes' }));
      const request = http.expectOne(`${adminUrl}/${category.id}`);
      expect(request.request.method).toBe('PATCH');
      expect(request.request.body).toEqual({ name: 'Légumes' });
      expect(request.request.withCredentials).toBe(true);
      request.flush({ success: true, data: { ...category, name: 'Légumes', slug: 'legumes' } });

      await expect(result).resolves.toEqual({ ...category, name: 'Légumes', slug: 'legumes' });
    });

    it('deleteEntity envoie DELETE /admin/categories/:id', async () => {
      const result = firstValueFrom(service.deleteEntity(category.id));
      const request = http.expectOne(`${adminUrl}/${category.id}`);
      expect(request.request.method).toBe('DELETE');
      expect(request.request.withCredentials).toBe(true);
      request.flush(null, { status: 204, statusText: 'No Content' });

      await expect(result).resolves.toBeNull();
    });
  });
});
