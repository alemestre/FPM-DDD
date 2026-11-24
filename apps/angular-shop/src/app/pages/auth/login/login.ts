import { email, form, FormField, FormRoot, minLength, required } from '@angular/forms/signals';
import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { ResendEmail } from '../register/resend-email/resend-email';
import { AuthService } from '../../../services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ADMIN_HOME_URL } from '../../../guards/admin.guard';
import { firstValueFrom } from 'rxjs';

interface LoginModel {
  email: string;
  password: string;
}

@Component({
  selector: 'app-login',
  imports: [FormRoot, FormField, RouterLink, ResendEmail],
  templateUrl: './login.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  /** Page ouverte après la connexion, sauf si l'URL porte un `?returnUrl=` interne. */
  readonly redirectTo = input('/home');
  /** Intégré dans une autre page (identification du checkout) : prend toute la largeur de son conteneur. */
  readonly embedded = input(false);
  /** Connexion à l'espace admin : l'API refuse les comptes clients, et la page ne propose pas l'inscription. */
  readonly admin = input(false);

  protected readonly model = signal<LoginModel>({ email: '', password: '' });
  protected readonly showPassword = signal(false);
  protected readonly serverError = signal<string | null>(null);
  /** Adresse saisie quand l'API répond 403 : le compte existe mais son e-mail n'est pas confirmé. */
  protected readonly unverifiedEmail = signal<string | null>(null);

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
          this.unverifiedEmail.set(null);
          const { email, password } = field().value();
          try {
            const login = this.admin()
              ? this.authService.adminLogin(email, password)
              : this.authService.login(email, password);
            await firstValueFrom(login);
            await this.router.navigateByUrl(this.redirectUrl());
          } catch (error) {
            if (error instanceof HttpErrorResponse && error.status === 403) {
              this.unverifiedEmail.set(email);
            }
            this.serverError.set(this.toErrorMessage(error));
          }
          return undefined;
        }
      }
    }
  );

  /**
   * Seul un chemin interne est suivi (`/…`, pas `//autre-site`) : pas de redirection ouverte.
   * Sans `returnUrl`, un admin connecté depuis la boutique arrive sur son tableau de bord ;
   * intégré au checkout, il continue sa commande.
   */
  private redirectUrl(): string {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    if (returnUrl?.startsWith('/') && !returnUrl.startsWith('//')) {
      return returnUrl;
    }
    return this.authService.isAdmin() && !this.embedded() ? ADMIN_HOME_URL : this.redirectTo();
  }

  protected togglePasswordVisibility() {
    this.showPassword.update((visible) => !visible);
  }

  private toErrorMessage(error: unknown) {
    if (error instanceof HttpErrorResponse && (error.status === 400 || error.status === 401)) {
      return 'Identifiants incorrects.';
    }
    if (error instanceof HttpErrorResponse && error.status === 403) {
      return 'Vous devez confirmer votre adresse e-mail avant de vous connecter. Consultez votre boîte mail.';
    }
    return 'Une erreur est survenue. Veuillez réessayer.';
  }
}
