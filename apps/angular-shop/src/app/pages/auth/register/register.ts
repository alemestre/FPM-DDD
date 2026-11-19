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
import { PHONE_PATTERN } from '../../../validators/phone';
import { POSTAL_CODE_PATTERN } from '../../../validators/postal-code';
import { ResendEmail } from './resend-email/resend-email';

interface RegisterModel {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  postalCode: string;
  city: string;
  password: string;
  confirmationPassword: string;
}

@Component({
  selector: 'app-register',
  imports: [FormRoot, FormField, RouterLink, ResendEmail],
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
    addressLine1: '',
    addressLine2: '',
    postalCode: '',
    city: '',
    password: '',
    confirmationPassword: ''
  });
  protected readonly showPassword = signal(false);
  protected readonly serverError = signal<string | null>(null);
  /** Adresse du compte créé : la page affiche alors « Consultez votre boîte mail ». */
  protected readonly registeredEmail = signal<string | null>(null);

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
      required(path.addressLine1, { message: "L'adresse est obligatoire." });
      required(path.postalCode, { message: 'Le code postal est obligatoire.' });
      pattern(path.postalCode, POSTAL_CODE_PATTERN, {
        message: 'Le code postal doit contenir 5 chiffres.'
      });
      required(path.city, { message: 'La ville est obligatoire.' });
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
          const { firstName, lastName, email, phone, password, addressLine1, addressLine2, postalCode, city } =
            field().value();
          try {
            await firstValueFrom(
              this.authService.register({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                phone,
                addressLine1: addressLine1.trim(),
                addressLine2: addressLine2.trim(),
                postalCode,
                city: city.trim(),
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
