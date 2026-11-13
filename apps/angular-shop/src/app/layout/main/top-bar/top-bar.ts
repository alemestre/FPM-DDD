import { Component, computed, inject, model } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../../../services/auth.service';
import { CartService } from '../../../services/cart.service';
import { Profile } from './profile/profile';

@Component({
    selector: 'app-top-bar',
  imports: [RouterLink, RouterLinkActive, NgbDropdownModule, Profile],
    templateUrl: './top-bar.html',
})
export class TopBar {
    private readonly authService = inject(AuthService);
    protected readonly cartService = inject(CartService);

    /** Ouverture du menu des catégories sur mobile, partagée avec le layout. */
    menuOpen = model(false);

    protected readonly isAuthenticated = this.authService.isConnected;
    protected readonly screenReaderText = computed(() => {
        const itemCount = this.cartService.totalItems();
        if (itemCount === 0) {
            return 'Votre panier est tristement vide';
        }
        const itemText = itemCount === 1 ? 'article' : 'articles';
        return `${itemCount} ${itemText} dans le panier`;
    });

    protected toggleMenu(): void {
        this.menuOpen.update((open) => !open);
    }

    protected closeMenu(): void {
        this.menuOpen.set(false);
    }
}
