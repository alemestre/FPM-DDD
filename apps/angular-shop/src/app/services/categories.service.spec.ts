import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { CategoriesService } from './categories.service';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(CategoriesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getCategoryBySlug appelle /categories/slug/:slug et renvoie la catégorie déballée', async () => {
    const category = { id: 'cat-1', name: 'Fruits & Légumes', slug: 'fruits-legumes' };

    const result = firstValueFrom(service.getCategoryBySlug('fruits-legumes'));
    const request = http.expectOne(`${environment.apiUrl}/categories/slug/fruits-legumes`);
    expect(request.request.method).toBe('GET');
    request.flush({ success: true, data: category });

    await expect(result).resolves.toEqual(category);
  });
});
