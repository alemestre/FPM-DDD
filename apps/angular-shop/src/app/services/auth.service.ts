import type { ApiResponseDto, CurrentUserResponseDto } from '@fpm/contracts';
import { Injectable, inject, signal, computed } from '@angular/core';
import { environment } from '../../environments/environment';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { User } from '../models/entities/user';
import { CONSTANTS } from '../constant';

export type RegisterPayload = Pick<User, 'firstName' | 'lastName' | 'email' | 'phone'> & {
    password: string;
};

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private httpClient = inject(HttpClient);
    private _currentUser = signal<User | null>(null);
    currentUser = this._currentUser.asReadonly();
    isConnected = computed(() => this.currentUser() !== null);
    private _apiUrl = environment.apiUrl;

    login(email: string, password: string): Observable<User> {
        return this.httpClient
            .post<ApiResponseDto<CurrentUserResponseDto>>(
                `${this._apiUrl}/${CONSTANTS.API_END_POINTS.LOGIN}`,
                { email, password },
                { withCredentials: true },
            )
            .pipe(
                // Le jeton d'accès arrive dans un cookie HTTP-only, illisible ici : seul le profil est renvoyé.
                map((response) => response.data),
                tap((user) => this._currentUser.set(user)),
            );
    }

    // Restaure la session au démarrage : les cookies HTTP-only sont envoyés automatiquement.
    loadCurrentUser(): Observable<User | null> {
        return this.httpClient
            .get<ApiResponseDto<CurrentUserResponseDto>>(
                `${this._apiUrl}/${CONSTANTS.API_END_POINTS.ME}`,
                { withCredentials: true },
            )
            .pipe(
                map((response) => response.data),
                tap((user) => this._currentUser.set(user)),
                catchError(() => {
                    // Pas de session valide (ou API indisponible) : visiteur non connecté
                    this._currentUser.set(null);
                    return of(null);
                }),
            );
    }

    /**
     * Crée le compte. L'API n'ouvre pas de session : le compte doit d'abord confirmer
     * son adresse e-mail avec le lien reçu, puis se connecter.
     */
    register(payload: RegisterPayload): Observable<void> {
        return this.httpClient
            .post<ApiResponseDto<CurrentUserResponseDto>>(
                `${this._apiUrl}/${CONSTANTS.API_END_POINTS.REGISTER}`,
                payload,
            )
            .pipe(map(() => undefined));
    }

    /** Confirme l'adresse e-mail avec le jeton reçu par e-mail. Répond 400 si le lien est invalide ou expiré. */
    verifyEmail(token: string): Observable<void> {
        return this.httpClient.post<void>(`${this._apiUrl}/${CONSTANTS.API_END_POINTS.VERIFY_EMAIL}`, { token });
    }

    /** Demande un nouveau lien. L'API répond toujours 204, qu'un compte existe ou non. */
    resendVerificationEmail(email: string): Observable<void> {
        return this.httpClient.post<void>(`${this._apiUrl}/${CONSTANTS.API_END_POINTS.RESEND_VERIFICATION}`, {
            email,
        });
    }

    // Méthode pour rafraîchir les tokens. Utilisée par l'intercepteur HTTP
    revokeToken(): Observable<any> {
        return this.httpClient.post<any>('/api/revoke-token', {}, { withCredentials: true }).pipe(
            tap((response) => {
                // Les nouveaux tokens sont automatiquement stockés dans des cookies HTTP-only
                console.log('Tokens refreshed successfully');
            }),
        );
    }

    logout(): Observable<any> {
        return this.httpClient
            .post<any>(
                `${this._apiUrl}/${CONSTANTS.API_END_POINTS.LOGOUT}`,
                {},
                { withCredentials: true },
            )
            .pipe(
                tap(() => {
                    // Le backend devrait supprimer les cookies
                    this._currentUser.set(null);
                }),
            );
    }
}
