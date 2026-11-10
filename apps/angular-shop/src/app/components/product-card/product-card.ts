import type { ProductUnitDto, ProductWithProducerResponseDto, QuantityUnitDto } from '@fpm/contracts';
import { Component, computed, input, output } from '@angular/core';

const UNIT_LABELS: Record<ProductUnitDto, string> = {
  KG: 'kg',
  BOTTE: 'botte',
  PIECE: 'pièce',
  CONDITIONNEMENT: 'conditionnement',
  BOUTEILLE: 'bouteille',
};

const QUANTITY_UNIT_LABELS: Record<QuantityUnitDto, string> = {
  pcs: 'pcs',
  g: 'g',
  ml: 'ml',
  kg: 'kg',
  l: 'l',
};

// Intl plutôt que CurrencyPipe : aucune locale fr n'est enregistrée dans l'application.
const PRICE_FORMAT = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
const QUANTITY_FORMAT = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 3 });

@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.html',
})
export class ProductCard {
  readonly product = input.required<ProductWithProducerResponseDto>();
  // Le contrat produit ne porte pas encore de photo : le parent la fournit.
  readonly imageUrl = input<string | null>(null);

  readonly addToCart = output<ProductWithProducerResponseDto>();

  readonly price = computed(() => PRICE_FORMAT.format(this.product().price));
  readonly unit = computed(() => UNIT_LABELS[this.product().unit]);
  readonly quantity = computed(() => {
    const { quantity, quantityUnit } = this.product();
    if (quantity === null) {
      return null;
    }
    const formatted = QUANTITY_FORMAT.format(quantity);
    return quantityUnit ? `${formatted} ${QUANTITY_UNIT_LABELS[quantityUnit]}` : formatted;
  });
  readonly isOutOfStock = computed(() => this.product().stock <= 0);

  protected onAddToCart(): void {
    if (!this.isOutOfStock()) {
      this.addToCart.emit(this.product());
    }
  }
}
