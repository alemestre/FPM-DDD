import type { ApiResponseDto, CustomerProfileResponseDto as Profile } from '@fpm/contracts';
import { environment } from '../../environments/environment';
import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CONSTANTS } from '../shared/constant';
import { map, Observable, tap } from 'rxjs';

/** Champs modifiables du profil : l'API refuse `id` et `email` (400). `address: null` supprime l'adresse. */
export type UpdateProfilePayload = Partial<Pick<Profile, 'firstName' | 'lastName' | 'phone' | 'address'>>;

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  protected httpClient = inject(HttpClient);
  private _apiUrl = environment.apiUrl;

  /** Profil du client connecté : `null` tant qu'il n'est pas chargé. Toute la page profil lit ce signal. */
  private readonly _profile = signal<Profile | null>(null);
  readonly profile = this._profile.asReadonly();

  /** Charge le profil dans `profile`. */
  getProfile(): Observable<Profile> {
    // On vide d'abord : un autre compte connecté dans ce navigateur ne doit pas voir l'ancien profil.
    this._profile.set(null);
    // Une réponse 401/404 arrive ici comme une erreur de l'Observable, pas comme une réponse vide.
    return this.httpClient.get<ApiResponseDto<Profile>>(`${this._apiUrl}/${CONSTANTS.API_END_POINTS.PROFILE}`, {
      withCredentials: true
    })
      .pipe(
        map(response => response.data),
        tap(profile => this._profile.set(profile))
      )
  }

  /** Enregistre les modifications et remplace `profile` par la version renvoyée par l'API. */
  updateProfile(updatedprofile: UpdateProfilePayload): Observable<Profile> {
    return this.httpClient.patch<ApiResponseDto<Profile>>(`${this._apiUrl}/${CONSTANTS.API_END_POINTS.PROFILE}`, updatedprofile, {
      withCredentials: true
    })
      .pipe(
        map(response => response.data),
        tap(profile => this._profile.set(profile))
      )
  }
}
