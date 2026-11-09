import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import {
  email,
  form,
  FormField,
  FormRoot,
  minLength,
  pattern,
  required,
  validate
} from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../services/auth.service';

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
  private readonly router = inject(Router);

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
      minLength(path.password, 8, {
        message: 'Le mot de passe doit contenir au moins 8 caractères.'
      });
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
                email,
                password
              })
            );
            await this.router.navigateByUrl('/home');
          } catch (error) {
            this.serverError.set(this.toErrorMessage(error));
          }
          return undefined;
        }
      }
    }
  );

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
