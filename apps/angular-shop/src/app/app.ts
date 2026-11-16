import { NotificationComponent } from './shared/notification/notification';
import { RouterModule } from '@angular/router';
import { Component, computed, inject } from '@angular/core';
import { AuthService } from './services/auth.service';
import { CartService } from './services/cart.service';

@Component({
  imports: [
    RouterModule,
    NotificationComponent
  ],
    selector: 'app-root',
    templateUrl: './app.html',
    styleUrl: './app.scss',
})
export class App {
    private readonly auth = inject(AuthService);
    private readonly cart = inject(CartService);

    protected title = 'La Ferme du Petit Marais';
    // Affiché tant que la session n'est pas vérifiée et que le panier n'est pas restauré.
    // Côté serveur, les deux restent à false : le HTML rendu contient le loader, comme le premier rendu client.
    protected readonly isLoading = computed(() => !this.auth.sessionChecked() || !this.cart.restored());
}
