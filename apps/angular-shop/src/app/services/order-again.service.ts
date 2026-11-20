import type { OrderResponseDto } from '@fpm/contracts';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CartService } from './cart.service';
import { NotificationService } from './notification.service';
import { ProductsService } from './products.service';

/**
 * Remet dans le panier le contenu d'une commande passée, avec les quantités confirmées par la
 * boutique. Les produits retirés de la commande (quantité 0) sont ignorés. Les produits supprimés
 * du catalogue, devenus indisponibles ou refusés par le panier sont comptés et signalés au client.
 */
@Injectable({
    providedIn: 'root',
})
export class OrderAgainService {
  private readonly notificationService = inject(NotificationService);
  private readonly productsService = inject(ProductsService);
  private readonly cartService = inject(CartService);
  private readonly router = inject(Router);

    async orderAgain(order: OrderResponseDto): Promise<void> {
        const items = order.items.filter((item) => item.confirmedQuantity > 0);
        if (items.length === 0) {
            this.notificationService.showError('Aucun produit de cette commande n’est disponible');
            return;
        }

        let products;
        try {
            products = await firstValueFrom(
                this.productsService.productsByIds(items.map((item) => item.productId)),
            );
        } catch {
            this.notificationService.showError(
                'Impossible de reprendre cette commande pour le moment. Veuillez réessayer.',
            );
            return;
        }

        const productsById = new Map(products.map((product) => [product.id, product]));
        let added = 0;
        for (const item of items) {
            const product = productsById.get(item.productId);
            if (
                product?.isAvailable &&
                this.cartService.addToCart(product, item.confirmedQuantity).success
            ) {
                added++;
            }
        }

        this.notify(added, items.length - added);
        if (added > 0) await this.router.navigateByUrl('/panier');
    }

    private notify(added: number, skipped: number): void {
        if (added === 0) {
            this.notificationService.showError('Aucun produit de cette commande n’est disponible');
        } else if (skipped === 0) {
            this.notificationService.showSuccess('Produits ajoutés au panier');
        } else {
            this.notificationService.showInfo(
                `${added} produit(s) ajouté(s) au panier, ${skipped} indisponible(s)`,
            );
        }
    }
}
