import type { ProductUnitDto, ProductWithProducerResponseDto as Product } from '@fpm/contracts';
import { Component, computed, input, output } from '@angular/core';

const UNIT_LABELS: Record<ProductUnitDto, string> = {
  KG: 'kg',
  BOTTE: 'botte',
  PIECE: 'pièce',
  DOUZAINE: 'douzaine',
  BOUTEILLE: 'bouteille',
  LOT: 'lot',
};

// Intl plutôt que CurrencyPipe : aucune locale fr n'est enregistrée dans l'application.
const PRICE_FORMAT = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
const QUANTITY_FORMAT = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 3 });

@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.html',
})
export class ProductCard {
  readonly product = input.required<Product>();

  readonly addToCart = output<Product>();

  readonly price = computed(() => PRICE_FORMAT.format(this.product().price));
  readonly unit = computed(() => UNIT_LABELS[this.product().unit]);
  /** « 4 × 125 g », « 1 l », « 6 pièces » ; rien pour une douzaine, l'unité le dit déjà. */
  readonly content = computed(() => {
    const { content, unit } = this.product();
    if (content === null || unit === 'DOUZAINE') {
      return null;
    }
    const { itemCount, itemSize } = content;
    if (itemSize === null) {
      return `${itemCount} pièces`;
    }
    const size = `${QUANTITY_FORMAT.format(itemSize.amount)} ${itemSize.unit}`;
    return itemCount === 1 ? size : `${itemCount} × ${size}`;
  });
  /** Prix au kilo ou au litre, sauf au kilo où c'est déjà le prix affiché. */
  readonly referencePrice = computed(() => {
    const { referencePrice, unit } = this.product();
    if (referencePrice === null || unit === 'KG') {
      return null;
    }
    return `${PRICE_FORMAT.format(referencePrice.amount)}/${referencePrice.unit}`;
  });
  readonly isOutOfStock = computed(() => this.product().stock <= 0);

  protected onAddToCart() {
    if (!this.isOutOfStock()) {
      this.addToCart.emit(this.product());
    }
  }
}
