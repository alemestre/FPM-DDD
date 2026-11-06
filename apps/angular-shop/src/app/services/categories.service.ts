import { environment } from '../../environments/environment';
import type { CategoryResponseDto, ApiResponseDto } from '@fpm/contracts';
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CONSTANTS } from '../constant';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CategoriesService {
  protected httpClient = inject(HttpClient);
  private _apiUrl = environment.apiUrl;

  getAllCategories(): Observable<CategoryResponseDto[]> {
    return this.httpClient.get<ApiResponseDto<CategoryResponseDto[]>>(`${this._apiUrl}/${CONSTANTS.API_END_POINTS.CATEGORIES}`)
      .pipe(
        map((response) => response.data),
      )
  }
}
