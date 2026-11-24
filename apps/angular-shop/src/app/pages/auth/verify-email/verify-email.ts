import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { email, form, FormField, FormRoot, required } from '@angular/forms/signals';
import { AbstractVerifyToken } from '../../../shared/abstract-verify-token';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

interface IResendModel {
  email: string;
}

/** Page ouverte depuis le lien de l'e-mail de vérification : /verifier-email?token=… */
@Component({
  selector: 'app-verify-email',
  imports: [FormRoot, FormField, RouterLink],
  templateUrl: './verify-email.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VerifyEmail extends AbstractVerifyToken {
  protected readonly resent = signal(false);
  protected readonly resendError = signal<string | null>(null);

  protected readonly resendModel = signal<IResendModel>({ email: '' });
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

  protected verifyToken(token: string) {
    return this.authService.verifyEmail(token);
  }
}
