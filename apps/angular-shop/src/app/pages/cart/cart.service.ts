import { ProductWithProducerResponseDto as Product } from '@fpm/contracts';
import { afterNextRender, computed, effect, inject, Injectable, signal } from '@angular/core';
import { LocalStorageService } from '../../services/local-storage.service';
import { CartItem } from './cart-item';

export const CART_STORAGE_KEY = 'fpm_cart';

@Injectable({
    providedIn: 'root',
})
export class CartService {
    private localStorageService = inject(LocalStorageService);
    private readonly MAX_QUANTITY = 99;
    private readonly MAX_CART_ITEMS = 50;

    // Computed signals for derived state
    private readonly cartItems = signal<CartItem[]>([]);
    items = this.cartItems.asReadonly();
    totalItems = computed(() => this.cartItems().reduce((total, item) => total + item.quantity, 0));
    subtotal = computed(() =>
        this.cartItems().reduce((total, item) => total + item.product.price * item.quantity, 0),
    );
    isEmpty = computed(() => this.cartItems().length === 0);
    tax = computed(() => this.subtotal() * 0.1); // 10% tax
    total = computed(() => this.subtotal() + this.tax());

    private readonly restored = signal(false);

    constructor() {
        // Restauré seulement dans le navigateur, après l'hydratation : le rendu serveur
        // (panier vide) et le premier rendu client restent identiques.
        afterNextRender(() => {
            const saved = this.loadCartFromStorage();
            this.restored.set(true);
            if (saved.length > 0) this.cartItems.set(saved);
        });

        // Sauvegarde à chaque changement, mais jamais avant la restauration
        // (sinon le panier vide initial écraserait le panier sauvegardé).
        effect(() => {
            const items = this.items();
            if (!this.restored()) return;
            this.localStorageService.setItem(CART_STORAGE_KEY, items);
        });
    }

    // localStorage peut contenir n'importe quoi (ancien format, édition manuelle) :
    // un panier qui n'est pas un tableau ferait planter totalItems et tout le rendu.
    private loadCartFromStorage(): CartItem[] {
      const saved = this.localStorageService.getItem<CartItem[]>(CART_STORAGE_KEY)
      return saved ? saved.slice(0, this.MAX_CART_ITEMS ) : []
    }

    addToCart(product: Product, quantity: number = 1): { success: boolean; message: string } {
        if (!Number.isSafeInteger(quantity) || quantity <= 0) {
            return { success: false, message: 'Quantity must be greater than 0' };
        }

        if (this.cartItems().length >= this.MAX_CART_ITEMS) {
            return { success: false, message: 'Cart is full. Remove items to add new ones.' };
        }

        const currentItems = this.cartItems();
        const existingItemIndex = currentItems.findIndex((item) => item.product.id === product.id);

        if (existingItemIndex > -1) {
            // Update existing item
            const currentQuantity = currentItems[existingItemIndex].quantity;
            const newQuantity = currentQuantity + quantity;

            if (newQuantity > this.MAX_QUANTITY) {
                return {
                    success: false,
                    message: `Cannot add more than ${this.MAX_QUANTITY} items of the same product`,
                };
            }

            this.cartItems.update((items) =>
                items.map((item, index) =>
                    index === existingItemIndex ? { ...item, quantity: newQuantity } : item,
                ),
            );
        } else {
            // Add new item
            if (quantity > this.MAX_QUANTITY) {
                return {
                    success: false,
                    message: `Cannot add more than ${this.MAX_QUANTITY} items`,
                };
            }

            this.cartItems.set([...currentItems, { product, quantity }]);
        }

        return { success: true, message: 'Item added to cart successfully' };
    }

    removeFromCart(productId: string): { success: boolean; message: string } {
        if (!productId) {
            return { success: false, message: 'Invalid product ID' };
        }

        const currentItems = this.cartItems();
        const newItems = currentItems.filter((item) => item.product.id !== productId);

        if (newItems.length === currentItems.length) {
            return { success: false, message: 'Item not found in cart' };
        }

        this.cartItems.set(newItems);
        return { success: true, message: 'Item removed from cart' };
    }

    updateQuantity(productId: string, quantity: number): { success: boolean; message: string } {
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
        const itemIndex = currentItems.findIndex((item) => item.product.id === productId);

        if (itemIndex === -1) return { success: false, message: 'Item not found in cart' };

        this.cartItems.update((items) =>
            items.map((item, index) => (index === itemIndex ? { ...item, quantity } : item)),
        );

        return { success: true, message: 'Quantity updated successfully' };
    }

    clearCart(): void {
        this.cartItems.set([]);
    }

    getItemQuantity(productId: string): number {
        const item = this.cartItems().find((item) => item.product.id === productId);
        return item?.quantity ?? 0;
    }

    isInCart(productId: string): boolean {
        return this.cartItems().some((item) => item.product.id === productId);
    }
}
