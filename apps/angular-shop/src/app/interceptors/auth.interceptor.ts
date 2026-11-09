import { HttpEvent, HttpHandlerFn, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, catchError, switchMap } from 'rxjs';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Pas de rafraîchissement pour l'appel de rafraîchissement lui-même : sinon boucle infinie sur 401.
      if (error.status === 401 && !req.url.includes('/api/revoke-token')) {
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
