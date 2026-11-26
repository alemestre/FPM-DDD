import { HttpErrorResponse } from '@angular/common/http';
import { apiErrorMessage } from './api-error-message';

describe('apiErrorMessage', () => {
  it("renvoie le message de l'API", () => {
    const error = new HttpErrorResponse({ status: 409, error: { message: 'Une catégorie avec un nom équivalent existe déjà' } });

    expect(apiErrorMessage(error, 'Erreur')).toBe('Une catégorie avec un nom équivalent existe déjà');
  });

  it.each([
    ['une réponse sans message', new HttpErrorResponse({ status: 500, error: null })],
    ['un message qui n’est pas un texte', new HttpErrorResponse({ status: 400, error: { message: ['champ'] } })],
    ['une autre erreur', new Error('réseau')]
  ])('renvoie le texte de repli pour %s', (_case, error) => {
    expect(apiErrorMessage(error, 'Erreur')).toBe('Erreur');
  });
});
