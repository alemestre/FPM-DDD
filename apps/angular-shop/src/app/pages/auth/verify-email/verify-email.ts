import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { email, form, FormField, FormRoot, required } from '@angular/forms/signals';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../services/auth.service';

/**
 * - `verifying` : appel à l'API en cours.
 * - `verified` : adresse confirmée, le compte peut se connecter.
 * - `invalid` : lien absent, invalide ou expiré ; un nouveau lien peut être demandé.
 * - `error` : erreur réseau ou serveur ; la vérification peut être relancée.
 */
export type VerificationStatus = 'verifying' | 'verified' | 'invalid' | 'error';

interface ResendModel {
  email: string;
}

/** Page ouverte depuis le lien de l'e-mail de vérification : /verifier-email?token=… */
@Component({
  selector: 'app-verify-email',
  imports: [FormRoot, FormField, RouterLink],
  templateUrl: './verify-email.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VerifyEmail implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly token = inject(ActivatedRoute).snapshot.queryParamMap.get('token');

  protected readonly status = signal<VerificationStatus>('verifying');
  protected readonly resent = signal(false);
  protected readonly resendError = signal<string | null>(null);

  protected readonly resendModel = signal<ResendModel>({ email: '' });
  protected readonly resendForm = form(
    this.resendModel,
    (path) => {
      required(path.email, { message: "L'adresse e-mail est obligatoire." });
      email(path.email, { message: "L'adresse e-mail n'est pas valide." });
    },
    {
      submission: {
        action: async (field) => {
          this.resendError.set(null);
          try {
            await firstValueFrom(this.authService.resendVerificationEmail(field().value().email));
            this.resent.set(true);
          } catch {
            this.resendError.set("L'envoi a échoué. Veuillez réessayer.");
          }
          return undefined;
        }
      }
    }
  );

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
      await firstValueFrom(this.authService.verifyEmail(this.token));
      this.status.set('verified');
    } catch (error) {
      this.status.set(error instanceof HttpErrorResponse && error.status === 400 ? 'invalid' : 'error');
    }
  }
}
