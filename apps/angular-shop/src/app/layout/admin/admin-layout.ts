import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { ADMIN_LOGIN_URL } from '../../guards/admin.guard';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterLink, RouterOutlet],
  templateUrl: './admin-layout.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminLayout {
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected logout(): void {
    this.authService.logout().subscribe({
      // Si l'API échoue, la session reste ouverte : le garde de /admin/login renvoie alors sur le tableau de bord.
      complete: () => this.router.navigateByUrl(ADMIN_LOGIN_URL),
      error: () => this.router.navigateByUrl(ADMIN_LOGIN_URL)
    });
  }
}
