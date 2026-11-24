import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ADMIN_HOME_URL } from '../../../guards/admin.guard';
import { Login } from '../../auth/login/login';

/** /admin/login : le formulaire de connexion de la boutique, en mode admin. */
@Component({
  selector: 'app-admin-login',
  imports: [Login],
  template: `<app-login [admin]="true" [redirectTo]="adminHomeUrl" />`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminLogin {
  protected readonly adminHomeUrl = ADMIN_HOME_URL;
}
