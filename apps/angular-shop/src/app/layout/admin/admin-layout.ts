import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ADMIN_LOGIN_URL } from '../../guards/admin.guard';
import { AuthService } from '../../services/auth.service';

interface AdminNavItem {
  label: string;
  /** Classe Bootstrap Icons, sans le préfixe `bi`. */
  icon: string;
  link: string;
  /** Actif seulement sur ce lien exact (le tableau de bord, sinon il serait actif partout). */
  exact?: boolean;
}

@Component({
  selector: 'app-admin-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-layout.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'closeSidebar()' }
})
export class AdminLayout {
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly navItems: readonly AdminNavItem[] = [
    { label: 'Tableau de bord', icon: 'bi-speedometer2', link: '/admin', exact: true },
    { label: 'Produits', icon: 'bi-basket', link: '/admin/produits' },
    { label: 'Catégories', icon: 'bi-tags', link: '/admin/categories' },
    { label: 'Producteurs', icon: 'bi-shop', link: '/admin/producteurs' },
    { label: 'Commandes', icon: 'bi-receipt', link: '/admin/commandes' },
    { label: 'Utilisateurs', icon: 'bi-people', link: '/admin/utilisateurs' }
  ];

  /** Sidebar ouverte sur mobile (sous lg) ; à partir de lg elle est toujours visible. */
  protected readonly sidebarOpen = signal(false);

  protected openSidebar(): void {
    this.sidebarOpen.set(true);
  }

  protected closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  protected logout(): void {
    this.closeSidebar();
    this.authService.logout().subscribe({
      // Si l'API échoue, la session reste ouverte : le garde de /admin/login renvoie alors sur le tableau de bord.
      complete: () => this.router.navigateByUrl(ADMIN_LOGIN_URL),
      error: () => this.router.navigateByUrl(ADMIN_LOGIN_URL)
    });
  }
}
