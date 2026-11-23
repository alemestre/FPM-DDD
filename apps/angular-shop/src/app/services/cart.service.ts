import type { ProductWithProducerResponseDto as Product } from '@fpm/contracts';
import {
    afterNextRender,
    computed,
    effect,
    inject,
    Injectable,
    signal,
    untracked,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, concat, map, Observable, of, switchMap, toArray } from 'rxjs';
import { LocalStorageService } from './local-storage.service';
import { NotificationService } from './notification.service';
import { CartApiService } from './cart-api.service';
import { AuthService } from './auth.service';
import { CartItem } from '../pages/cart/cart-item';
import { lineAmounts, LineAmounts, sumCents } from '../shared/money';

export const CART_STORAGE_KEY = 'fpm_cart';

type CartResult = { success: boolean; message: string };

/**
 * Panier de la boutique. Invité : enregistré dans le localStorage. Client connecté : enregistré
 * par l'API, et le panier affiché est celui que l'API renvoie (elle vérifie le stock).
 * À la connexion, le panier local est ajouté à celui du compte puis vidé : à la déconnexion,
 * le panier affiché redevient donc celui, vide, de l'invité.
 */
@Injectable({
    providedIn: 'root',
})
export class CartService {
    private readonly localStorageService = inject(LocalStorageService);
    private readonly notificationService = inject(NotificationService);
    private readonly authService = inject(AuthService);
    private readonly cartApi = inject(CartApiService);
    private readonly MAX_QUANTITY = 10;
    private readonly MAX_CART_ITEMS = 50;

    // Computed signals for derived state
    private readonly cartItems = signal<CartItem[]>([]);
    items = this.cartItems.asReadonly();
    totalItems = computed(() => this.cartItems().reduce((total, item) => total + item.quantity, 0));
    /** Totaux du panier, avec la même règle d'arrondi que l'API (voir `shared/money.ts`). */
    subtotal = computed(() =>
        sumCents(this.cartItems().map((item) => this.lineAmounts(item).subtotal)),
    );
    isEmpty = computed(() => this.cartItems().length === 0);
    tax = computed(() => sumCents(this.cartItems().map((item) => this.lineAmounts(item).tax)));
    total = computed(() => sumCents([this.subtotal(), this.tax()]));

    private readonly _restored = signal(false);
    readonly restored = this._restored.asReadonly();

    /** Passe à true après le premier rendu, dans le navigateur seulement. */
    private readonly ready = signal(false);

    /** HT, TVA et TTC d'une ligne : la somme des lignes affichées est égale au total. */
    lineAmounts(item: CartItem): LineAmounts {
        return lineAmounts(item.product.price, item.product.vatRate, item.quantity);
    }

    constructor() {
        // Le rendu serveur (panier vide) et le premier rendu client restent identiques :
        // rien n'est chargé avant l'hydratation.
        afterNextRender(() => this.ready.set(true));

        // Au démarrage, puis à chaque connexion ou déconnexion.
        effect(() => {
            if (!this.ready()) return;
            const connected = this.authService.isConnected();
            untracked(() => (connected ? this.loadAccountCart() : this.loadGuestCart()));
        });

        // Sauvegarde du panier d'un invité à chaque changement, jamais avant la restauration
        // (sinon le panier vide initial écraserait le panier sauvegardé).
        effect(() => {
            const items = this.items();
            if (!this.restored() || this.authService.isConnected()) return;
            this.localStorageService.setItem(CART_STORAGE_KEY, items);
        });
    }

    private loadGuestCart(): void {
        this.cartItems.set(this.loadCartFromStorage());
        this._restored.set(true);
    }

    /**
     * Ajoute un par un les produits du panier local à celui du compte (les quantités
     * s'additionnent), puis affiche le panier du compte et vide le localStorage.
     * Un produit refusé par l'API (stock, limite) ne bloque pas les autres : il est signalé.
     */
    private loadAccountCart(): void {
        const additions = this.loadCartFromStorage().map(({ product, quantity }) =>
            this.cartApi.add(product.id, quantity).pipe(
                map(() => true),
                catchError(() => of(false)),
            ),
        );

        concat(...additions)
            .pipe(
                toArray(),
                switchMap((added) =>
                    this.cartApi
                        .load()
                        .pipe(
                            map((items) => ({ items, refused: added.filter((ok) => !ok).length })),
                        ),
                ),
            )
            .subscribe({
                next: ({ items, refused }) => {
                    this.localStorageService.removeItem(CART_STORAGE_KEY);
                    this.cartItems.set(items);
                    this._restored.set(true);
                    if (refused > 0) {
                        this.notificationService.showInfo(
                            `${refused} produit(s) de votre panier n’ont pas pu être ajoutés à votre compte (stock ou quantité maximale atteints)`,
                        );
                    }
                },
                error: () => {
                    this.cartItems.set([]);
                    this._restored.set(true);
                    this.notificationService.showError(
                        'Impossible de charger votre panier pour le moment. Veuillez réessayer.',
                    );
                },
            });
    }

    /** Envoie une modification à l'API ; le panier affiché devient celui qu'elle renvoie. */
    private send(request: Observable<CartItem[]>): void {
        request.subscribe({
            // Une réponse arrivée après la déconnexion ne doit pas réafficher le panier du compte.
            next: (items) => {
                if (this.authService.isConnected()) this.cartItems.set(items);
            },
            error: (error: unknown) =>
                this.notificationService.showError(this.toErrorMessage(error)),
        });
    }

    private toErrorMessage(error: unknown): string {
        return error instanceof HttpErrorResponse &&
            error.status === 400 &&
            typeof error.error?.message === 'string'
            ? error.error.message
            : 'Votre panier n’a pas pu être mis à jour. Veuillez réessayer.';
    }

    // localStorage peut contenir n'importe quoi (ancien format, édition manuelle) :
    // un panier qui n'est pas un tableau ferait planter totalItems et tout le rendu.
    private loadCartFromStorage(): CartItem[] {
        const saved = this.localStorageService.getItem(CART_STORAGE_KEY);
        if (!Array.isArray(saved)) return [];
        return saved.filter((item) => this.isValidCartItem(item)).slice(0, this.MAX_CART_ITEMS);
    }

    // Vérifie ce dont le panier a besoin : un id pour identifier le produit, un prix et
    // un taux de TVA pour les totaux, et une quantité acceptée par addToCart.
    private isValidCartItem(value: unknown): value is CartItem {
        if (typeof value !== 'object' || value === null) return false;
        const { product, quantity } = value as Record<string, unknown>;
        if (typeof product !== 'object' || product === null) return false;
        const { id, price, vatRate } = product as Record<string, unknown>;
        return (
            typeof id === 'string' &&
            id.length > 0 &&
            typeof price === 'number' &&
            Number.isFinite(price) &&
            typeof vatRate === 'number' &&
            Number.isFinite(vatRate) &&
            Number.isSafeInteger(quantity) &&
            (quantity as number) > 0 &&
            (quantity as number) <= this.MAX_QUANTITY
        );
    }

    addToCart(product: Product, quantity = 1): CartResult {
        if (!Number.isSafeInteger(quantity) || quantity <= 0) {
            return { success: false, message: 'Quantity must be greater than 0' };
        }

        const currentItems = this.cartItems();
        const existing = currentItems.find((item) => item.product.id === product.id);

        if (!existing && currentItems.length >= this.MAX_CART_ITEMS) {
            return { success: false, message: 'Cart is full. Remove items to add new ones.' };
        }

        const newQuantity = (existing?.quantity ?? 0) + quantity;
        if (newQuantity > this.MAX_QUANTITY) {
            return {
                success: false,
                message: `Cannot add more than ${this.MAX_QUANTITY} items of the same product`,
            };
        }

        if (this.authService.isConnected()) {
            this.send(this.cartApi.add(product.id, quantity));
        } else if (existing) {
            this.cartItems.set(
                currentItems.map((item) =>
                    item === existing ? { ...item, quantity: newQuantity } : item,
                ),
            );
        } else {
            this.cartItems.set([...currentItems, { product, quantity }]);
        }

        return { success: true, message: 'Item added to cart successfully' };
    }

    removeFromCart(productId: string): CartResult {
        if (!productId) {
            return { success: false, message: 'Invalid product ID' };
        }

        const currentItems = this.cartItems();
        if (!currentItems.some((item) => item.product.id === productId)) {
            return { success: false, message: 'Item not found in cart' };
        }

        if (this.authService.isConnected()) {
            this.send(this.cartApi.remove(productId));
        } else {
            this.cartItems.set(currentItems.filter((item) => item.product.id !== productId));
        }
        return { success: true, message: 'Item removed from cart' };
    }

    updateQuantity(productId: string, quantity: number): CartResult {
        if (!productId) {
            return { success: false, message: 'Invalid product ID' };
        }

        if (!Number.isSafeInteger(quantity)) {
            return { success: false, message: 'Invalid quantity' };
        }

        if (quantity <= 0) {
            return this.removeFromCart(productId);
        }

        if (quantity > this.MAX_QUANTITY) {
            return {
                success: false,
                message: `Cannot add more than ${this.MAX_QUANTITY} items of the same product`,
            };
        }

        const currentItems = this.cartItems();
        if (!currentItems.some((item) => item.product.id === productId)) {
            return { success: false, message: 'Item not found in cart' };
        }

        if (this.authService.isConnected()) {
            this.send(this.cartApi.changeQuantity(productId, quantity));
        } else {
            this.cartItems.set(
                currentItems.map((item) =>
                    item.product.id === productId ? { ...item, quantity } : item,
                ),
            );
        }

        return { success: true, message: 'Quantity updated successfully' };
    }

    clearCart(): void {
        if (this.authService.isConnected()) {
            this.send(this.cartApi.clear().pipe(map(() => [])));
        } else {
            this.cartItems.set([]);
        }
    }
}
