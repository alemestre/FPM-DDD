import { email, form, FormField, FormRoot, minLength, required } from '@angular/forms/signals';
import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { NotificationService } from '../../../services/notification.service';

interface LoginModel {
  email: string;
  password: string;
}

@Component({
  selector: 'app-login',
  imports: [FormRoot, FormField, RouterLink],
  templateUrl: './login.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly model = signal<LoginModel>({ email: '', password: '' });
  protected readonly showPassword = signal(false);
  protected readonly serverError = signal<string | null>(null);

  protected readonly loginForm = form(
    this.model,
    (path) => {
      required(path.email, { message: "L'adresse e-mail est obligatoire." });
      email(path.email, { message: "L'adresse e-mail n'est pas valide." });
      required(path.password, { message: 'Le mot de passe est obligatoire.' });
      minLength(path.password, 8, {
        message: 'Le mot de passe doit contenir au moins 8 caractères.'
      });
    },
    {
      submission: {
        action: async (field) => {
          this.serverError.set(null);
          const { email, password } = field().value();
          try {
            await firstValueFrom(this.authService.login(email, password));
            await this.router.navigateByUrl('/home');
          } catch (error) {
            this.serverError.set(this.toErrorMessage(error));
          }
          return undefined;
        }
      }
    }
  );

  protected togglePasswordVisibility() {
    this.showPassword.update((visible) => !visible);
  }

  private toErrorMessage(error: unknown) {
    if (error instanceof HttpErrorResponse && (error.status === 400 || error.status === 401)) {
      return 'Identifiants incorrects.';
    }
    return 'Une erreur est survenue. Veuillez réessayer.';
  }
}
