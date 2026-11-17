import { CustomerProfileResponseDto as Profile } from '@fpm/contracts';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { Component, inject, input, signal } from '@angular/core';
import { form, FormField, FormRoot, required, validate } from '@angular/forms/signals';
import { passwordRuleErrors } from '../../../../validators/password-rules';
import { NotificationService } from '../../../../services/notification.service';

interface PasswordModel {
  currentPassword: string;
  newPassword: string;
  confirmationPassword: string;
}

const EMPTY_PASSWORD: PasswordModel = {
  currentPassword: '',
  newPassword: '',
  confirmationPassword: ''
};

@Component({
  selector: 'app-password',
  imports: [NgbDropdownModule, FormRoot, FormField],
  templateUrl: './password.html',
  // Colonne de la grille portée par l'hôte : Bootstrap exige une colonne enfant direct de .row.
  host: { class: 'col-12 col-lg-5' }
})
export class Password {
  private readonly notificationService = inject(NotificationService);

  profile = input.required<Profile>();

  protected readonly passwordError = signal<string | null>(null);
  protected readonly showPassword = signal(false);

  private readonly passwordModel = signal<PasswordModel>({ ...EMPTY_PASSWORD });

  protected readonly passwordForm = form(
    this.passwordModel,
    (path) => {
      required(path.currentPassword, { message: 'Le mot de passe actuel est obligatoire.' });
      required(path.newPassword, { message: 'Le nouveau mot de passe est obligatoire.' });
      validate(path.newPassword, ({ value }) =>
        value() ? passwordRuleErrors(value()) : undefined
      );
      required(path.confirmationPassword, { message: 'Veuillez confirmer le mot de passe.' });
      validate(path.confirmationPassword, ({ value, valueOf }) =>
        value() && value() !== valueOf(path.newPassword)
          ? {
            kind: 'passwordMismatch',
            message: 'Les mots de passe ne correspondent pas.'
          }
          : undefined
      );
    },
    {
      submission: {
        action: async () => {
          this.passwordError.set(null);
          // TODO: envoyer { currentPassword, newPassword } à l'API ; un 401/400 ira dans passwordError.
          this.passwordModel.set({ ...EMPTY_PASSWORD });
          this.passwordForm().reset();
          this.notificationService.showSuccess("Votre mot de passe a été modifié.")
          return undefined;
        }
      }
    }
  );

  protected togglePasswordVisibility() {
    this.showPassword.update((visible) => !visible);
  }
}
