import { NgbDropdown, NgbDropdownItem, NgbDropdownMenu, NgbDropdownToggle } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../../../../services/auth.service';
import { Component, inject, model } from '@angular/core';
import { Router, RouterLink } from '@angular/router';


@Component({
  selector: 'app-profile',
  imports: [RouterLink, NgbDropdownItem, NgbDropdown, NgbDropdownToggle, NgbDropdownMenu],
  templateUrl: './profile.html'
})
export class Profile {
  readonly menuOpen = model(false);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  protected logout(): void {
    this.closeMenu();
    this.authService.logout().subscribe({
      // Même si l'API échoue, l'utilisateur quitte les pages protégées.
      complete: () => this.router.navigateByUrl('/home'),
      error: () => this.router.navigateByUrl('/home')
    });
  }
}
