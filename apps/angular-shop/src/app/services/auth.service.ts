import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '../models/entities/user';
import { catchError, map, Observable, of, tap } from 'rxjs';

export type RegisterPayload = Pick<User, 'firstName' | 'lastName' | 'email' | 'phone'> & {
  password: string;
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient)
  private _currentUser = signal<User | null>(null)
  currentUser = this._currentUser.asReadonly()
  isConnected = computed(() => this.currentUser() !== null)

  login(username: string, password: string): Observable<{
    user: User
  }> {
    return this.http.post<{
      user: User
    }>('/api/login', { username, password }, { withCredentials: true })
      .pipe(
        tap(response => {
          // Les deux tokens sont automatiquement stockés dans des cookies HTTP-only
          // Nous mettons à jour l'état de l'utilisateur connecté
          this._currentUser.set(response.user);
        })
      );
  }

  // Restaure la session au démarrage : les cookies HTTP-only sont envoyés automatiquement.
  loadCurrentUser(): Observable<User | null> {
    return this.http.get<{ user: User }>('/api/me', { withCredentials: true })
      .pipe(
        tap(response => this._currentUser.set(response.user)),
        map(response => response.user),
        catchError(() => {
          // Pas de session valide (ou API indisponible) : visiteur non connecté
          this._currentUser.set(null);
          return of(null);
        })
      );
  }

  register(payload: RegisterPayload): Observable<{ user: User }> {
    return this.http.post<{ user: User }>('/api/register', payload, { withCredentials: true })
      .pipe(
        tap(response => {
          // Comme pour login : les tokens arrivent dans des cookies HTTP-only
          this._currentUser.set(response.user);
        })
      );
  }

  // Méthode pour rafraîchir les tokens. Utilisée par l'intercepteur HTTP
  revokeToken(): Observable<any> {
    return this.http.post<any>('/api/revoke-token', {}, { withCredentials: true })
      .pipe(
        tap(response => {
          // Les nouveaux tokens sont automatiquement stockés dans des cookies HTTP-only
          console.log('Tokens refreshed successfully');
        })
      );
  }

  logout(): Observable<any> {
    return this.http.post<any>('/api/logout', {}, { withCredentials: true })
      .pipe(
        tap(() => {
          // Le backend devrait supprimer les cookies
          this._currentUser.set(null);
        })
      );
  }
}
