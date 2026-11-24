import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { form, FormField, FormRoot, required, validate } from '@angular/forms/signals';
import { passwordRuleErrors } from '../../../../validators/password-rules';
import { AuthService } from '../../../../services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

interface IResetPassword {
  password: string;
  confirmationPassword: string;
}

@Component({
  selector: 'app-reset-password-form',
  imports: [FormRoot, FormField, RouterLink],
  templateUrl: './reset-password-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResetPasswordForm {
  private readonly authService = inject(AuthService);

  /** Jeton du lien reçu par e-mail, déjà vérifié par la page parente. */
  readonly token = input.required<string>();

  protected readonly model = signal<IResetPassword>({ password: '', confirmationPassword: '' });
  protected readonly showPassword = signal(false);
  protected readonly serverError = signal<string | null>(null);
  /** Mot de passe modifié : le formulaire laisse place au message de succès. */
  protected readonly done = signal(false);

  protected readonly resetPasswordForm = form(
    this.model,
    (path) => {
      required(path.password, { message: 'Le mot de passe est obligatoire.' });
      validate(path.password, ({ value }) => (value() ? passwordRuleErrors(value()) : undefined));
      required(path.confirmationPassword, { message: 'Veuillez confirmer le mot de passe.' });
      validate(path.confirmationPassword, ({ value, valueOf }) =>
        value() && value() !== valueOf(path.password)
          ? { kind: 'passwordMismatch', message: 'Les mots de passe ne correspondent pas.' }
          : undefined
      );
    },
    {
      submission: {
        action: async (field) => {
          this.serverError.set(null);
          try {
            await firstValueFrom(this.authService.resetPassword(this.token(), field().value().password));
            this.done.set(true);
          } catch (error) {
            this.serverError.set(this.toErrorMessage(error));
          }
          return undefined;
        }
      }
    }
  );

  /** Un 400 porte la raison du refus (lien expiré, mot de passe identique à l'actuel…) : on l'affiche. */
  private toErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 400) {
      const message: unknown = error.error?.message;
      return typeof message === 'string' ? message : 'Les informations saisies sont invalides.';
    }
    return 'Une erreur est survenue. Veuillez réessayer.';
  }

  protected togglePasswordVisibility(): void {
    this.showPassword.update((visible) => !visible);
  }
}
