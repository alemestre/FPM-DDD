import { OrderResponseDto as Order, OrderStatusDto, ProductWithProducerResponseDto as Product } from '@fpm/contracts';
import { STATUS_BADGES, StatusBadge } from '../orders';
import { Component, computed, inject, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '../../../../services/cart.service';
import { ProductsService } from '../../../../services/products.service';


@Component({
  selector: 'app-order-card',
  templateUrl: './order-card.html',
  imports: [
    DatePipe,
    RouterLink
  ]
})
export class OrderCard {
  readonly order = input.required<Order>();
  readonly productQty = computed(() =>
    new Map(
      this.order().items.map(item => [item.productId, item.quantity])
    )
  );
  private readonly cartService = inject(CartService);
  private readonly productsService = inject(ProductsService);

  private readonly productsIds = computed(() => {
    const items = this.order().items;
    return items.map(item => item.productId);
  });

  protected readonly productsResource = this.productsService.productsByIdRessource(this.productsIds);
  protected readonly products = computed<Product[] | undefined>(() =>
    this.productsResource.hasValue() ? this.productsResource.value().data : undefined
  );

  protected badgeOf(status: OrderStatusDto): StatusBadge {
    return STATUS_BADGES[status];
  }

  orderAgain() {
    const products = this.products();
    products?.map(product => {
      const qty = this.productQty().get(product.id);
      if (qty)
        this.cartService.addToCart(product, qty);
    });
  }

}
