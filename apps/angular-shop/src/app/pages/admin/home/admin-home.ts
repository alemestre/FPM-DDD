import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AuthService } from '../../../services/auth.service';

/** Tableau de bord de l'espace admin (/admin). */
@Component({
  selector: 'app-admin-home',
  templateUrl: './admin-home.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminHome {
  protected readonly currentUser = inject(AuthService).currentUser;
}
