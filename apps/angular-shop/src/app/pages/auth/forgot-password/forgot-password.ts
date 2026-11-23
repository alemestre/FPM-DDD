import { email, form, FormField, FormRoot, required } from '@angular/forms/signals';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

interface ForgotPasswordModel {
  email: string;
}

/** Page ouverte depuis le lien « Mot de passe oublié ? » du formulaire de connexion. */
@Component({
  selector: 'app-forgot-password',
  imports: [FormRoot, FormField, RouterLink],
  templateUrl: './forgot-password.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ForgotPassword {
  private readonly authService = inject(AuthService);
  protected readonly model = signal<ForgotPasswordModel>({ email: '' });
  /** Le message reste le même que le compte existe ou non, pour ne pas révéler les adresses inscrites. */
  protected readonly sent = signal(false);
  protected readonly serverError = signal<null | string>(null);

  protected readonly forgotPasswordForm = form(
    this.model,
    (path) => {
      required(path.email, { message: 'L\'adresse e-mail est obligatoire.' });
      email(path.email, { message: 'L\'adresse e-mail n\'est pas valide.' });
    },
    {
      submission: {
        action: async (field) => {
          this.serverError.set(null);
          try {
            await firstValueFrom(this.authService.forgotPassword(field().value().email));
            this.sent.set(true);
          } catch {
            this.serverError.set('Une erreur est survenue. Veuillez réessayer.');
          }
          return undefined;
        }
      }
    }
  );
}
