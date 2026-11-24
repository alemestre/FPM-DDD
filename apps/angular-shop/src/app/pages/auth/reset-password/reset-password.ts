import { AbstractVerifyToken } from '../../../shared/abstract-verify-token';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ResetPasswordForm } from './form/reset-password-form';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';

/** Page ouverte depuis le lien de l'e-mail « Mot de passe oublié » : /reinitialiser-mot-de-passe?token=… */
@Component({
  selector: 'app-reset-password',
  imports: [ResetPasswordForm, RouterLink],
  templateUrl: './reset-password.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResetPassword extends AbstractVerifyToken {
  protected verifyToken(token: string): Observable<void> {
    return this.authService.verifyForgotPasswordToken(token);
  }
}
