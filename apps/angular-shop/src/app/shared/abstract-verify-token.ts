import { Directive, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { firstValueFrom, Observable } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

/**
 * - `verifying` : appel à l'API en cours.
 * - `verified` : jeton accepté.
 * - `invalid` : lien absent, invalide ou expiré ; un nouveau lien peut être demandé.
 * - `error` : erreur réseau ou serveur ; la vérification peut être relancée.
 */
export type VerificationStatus = 'verifying' | 'verified' | 'invalid' | 'error';

/** Base des pages ouvertes depuis un lien d'e-mail : vérifie le jeton `?token=…` à l'ouverture. */
@Directive()
export abstract class AbstractVerifyToken implements OnInit {
  protected readonly authService = inject(AuthService);
  protected readonly token = inject(ActivatedRoute).snapshot.queryParamMap.get('token');
  protected readonly status = signal<VerificationStatus>('verifying');

  protected abstract verifyToken(token: string): Observable<void>;

  ngOnInit() {
    void this.verify();
  }

  protected async verify() {
    if (!this.token) {
      this.status.set('invalid');
      return;
    }

    this.status.set('verifying');
    try {
      await firstValueFrom(this.verifyToken(this.token));
      this.status.set('verified');
    } catch (error) {
      this.status.set(error instanceof HttpErrorResponse && error.status === 400 ? 'invalid' : 'error');
    }
  }
}
