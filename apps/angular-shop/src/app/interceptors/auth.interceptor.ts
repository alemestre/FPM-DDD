import { HttpEvent, HttpHandlerFn, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, catchError, switchMap } from 'rxjs';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Appels d'authentification pour lesquels un 401 est une réponse normale
 * (identifiants incorrects, pas de session) : on ne tente pas de rafraîchir le jeton.
 * revoke-token en fait partie, sinon un 401 sur le rafraîchissement bouclerait à l'infini.
 */
const AUTH_ENDPOINTS = ['/login', '/logout', '/me', '/revoke-token'];

const isAuthEndpoint = (url: string): boolean => AUTH_ENDPOINTS.some((endpoint) => url.endsWith(endpoint));

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isAuthEndpoint(req.url)) {
        return authService.revokeToken().pipe(
          switchMap(() => {
            return next(req);
          }),
          catchError((refreshError) => {
            // Si le rafraîchissement échoue, déconnectez l'utilisateur
            authService.logout();
            return throwError(() => refreshError);
          })
        );
      }
      return throwError(() => error);
    })
  );
}
