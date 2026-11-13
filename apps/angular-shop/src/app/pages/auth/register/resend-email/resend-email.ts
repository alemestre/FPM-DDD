import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import {
  email,
  form,
  FormField,
  FormRoot,
  pattern,
  required,
  validate
} from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { passwordRuleErrors } from '../../../validators/password-rules';

interface RegisterModel {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmationPassword: string;
}

/** Numéro français : 0X XX XX XX XX ou +33 X XX XX XX XX, séparateurs facultatifs. */
const PHONE_PATTERN = /^(?:\+33\s?|0)[1-9](?:[\s.-]?\d{2}){4}$/;

@Component({
  selector: 'app-register',
  imports: [FormRoot, FormField, RouterLink],
  templateUrl: './register.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Register {
  private readonly authService = inject(AuthService);

  protected readonly model = signal<RegisterModel>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmationPassword: ''
  });
  protected readonly showPassword = signal(false);
  protected readonly serverError = signal<string | null>(null);
  /** Adresse du compte créé : la page affiche alors « Consultez votre boîte mail ». */
  protected readonly registeredEmail = signal<string | null>(null);
  protected readonly resendStatus = signal<'idle' | 'sending' | 'sent' | 'failed'>('idle');

  protected readonly registerForm = form(
    this.model,
    (path) => {
      required(path.firstName, { message: 'Le prénom est obligatoire.' });
      required(path.lastName, { message: 'Le nom est obligatoire.' });
      required(path.email, { message: "L'adresse e-mail est obligatoire." });
      email(path.email, { message: "L'adresse e-mail n'est pas valide." });
      required(path.phone, { message: 'Le numéro de téléphone est obligatoire.' });
      pattern(path.phone, PHONE_PATTERN, {
        message: "Le numéro de téléphone n'est pas valide."
      })
      required(path.password, { message: 'Le mot de passe est obligatoire.' });
      validate(path.password, ({ value }) => (value() ? passwordRuleErrors(value()) : undefined));
      required(path.confirmationPassword, {
        message: 'Veuillez confirmer le mot de passe.'
      });
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
          const { firstName, lastName, email, phone, password } = field().value();
          try {
            await firstValueFrom(
              this.authService.register({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                phone,
                email,
                password
              })
            );
            // Pas de session : le compte doit d'abord confirmer son adresse e-mail.
            this.registeredEmail.set(email);
          } catch (error) {
            this.serverError.set(this.toErrorMessage(error));
          }
          return undefined;
        }
      }
    }
  );

  /** Renvoie l'e-mail de confirmation à l'adresse qui vient d'être inscrite. */
  protected async resendVerificationEmail(): Promise<void> {
    const email = this.registeredEmail();
    if (!email) {
      return;
    }
    this.resendStatus.set('sending');
    try {
      await firstValueFrom(this.authService.resendVerificationEmail(email));
      this.resendStatus.set('sent');
    } catch {
      this.resendStatus.set('failed');
    }
  }

  protected togglePasswordVisibility(): void {
    this.showPassword.update((visible) => !visible);
  }

  private toErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 409) {
        return 'Un compte existe déjà avec cette adresse e-mail.';
      }
      if (error.status === 400) {
        return 'Les informations saisies sont invalides.';
      }
    }
    return 'Une erreur est survenue. Veuillez réessayer.';
  }
}
