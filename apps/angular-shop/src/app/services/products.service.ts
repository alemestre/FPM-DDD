import { environment } from '../../environments/environment';
import type { ApiResponseDto, ProductWithProducerResponseDto } from '@fpm/contracts';
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CONSTANTS } from '../shared/constant';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  protected httpClient = inject(HttpClient);
  private _apiUrl = environment.apiUrl;

  getAvailableProducts(): Observable<ProductWithProducerResponseDto[]> {
    return this.httpClient.get<ApiResponseDto<ProductWithProducerResponseDto[]>>(`${this._apiUrl}/${CONSTANTS.API_END_POINTS.PRODUCTS}`, {
      params: { isAvailable: true }
    })
      .pipe(
        map((response) => response.data),
      )
  }

  getActiveProductsByCategoryId(categoryId: string): Observable<ProductWithProducerResponseDto[]> {
    return this.httpClient
      .get<ApiResponseDto<ProductWithProducerResponseDto[]>>(`${this._apiUrl}/${CONSTANTS.API_END_POINTS.PRODUCTS}`, {
        params: { categoryId, isActive: true }
      })
      .pipe(map((response) => response.data));
  }
}
