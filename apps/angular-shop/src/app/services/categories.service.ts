import { environment } from '../../environments/environment';
import type { CategoryResponseDto as Category, ApiResponseDto } from '@fpm/contracts';
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CONSTANTS } from '../shared/constant';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CategoriesService {
  protected httpClient = inject(HttpClient);
  private _apiUrl = environment.apiUrl;

  getAllCategories(): Observable<Category[]> {
    return this.httpClient.get<ApiResponseDto<Category[]>>(`${this._apiUrl}/${CONSTANTS.API_END_POINTS.CATEGORIES}`)
      .pipe(
        map((response) => response.data),
      )
  }

  getCategoryBySlug(slug: string): Observable<Category> {
    return this.httpClient
      .get<ApiResponseDto<Category>>(
        `${this._apiUrl}/${CONSTANTS.API_END_POINTS.CATEGORY_BY_SLUG}/${encodeURIComponent(slug)}`
      )
      .pipe(map((response) => response.data));
  }
}
