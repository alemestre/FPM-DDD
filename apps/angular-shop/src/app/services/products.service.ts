import { environment } from '../../environments/environment';
import type { ApiResponseDto, ProductWithProducerResponseDto } from '@fpm/contracts';
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CONSTANTS } from '../constant';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  protected httpClient = inject(HttpClient);
  private _apiUrl = environment.apiUrl;

  getAllProducts(): Observable<ProductWithProducerResponseDto[]> {
    return this.httpClient.get<ApiResponseDto<ProductWithProducerResponseDto[]>>(`${this._apiUrl}/${CONSTANTS.API_END_POINTS.PRODUCTS}`)
      .pipe(
        map((response) => response.data),
      )
  }

  getProductsByCategoryId(categoryId: string): Observable<ProductWithProducerResponseDto[]> {
    return this.httpClient
      .get<ApiResponseDto<ProductWithProducerResponseDto[]>>(`${this._apiUrl}/${CONSTANTS.API_END_POINTS.PRODUCTS}`, {
        params: { categoryId }
      })
      .pipe(map((response) => response.data));
  }
}
