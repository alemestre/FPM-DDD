import { HttpErrorResponse } from '@angular/common/http';

/**
 * Message à afficher pour une erreur d'appel API : celui que l'API renvoie (`{ message }`, par
 * exemple sur un 409), sinon `fallback`.
 */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    const message: unknown = error.error?.message;
    if (typeof message === 'string' && message !== '') {
      return message;
    }
  }
  return fallback;
}
