import { ProductWithProducerResponseDto as Product } from '@fpm/contracts';

export interface CartItem {
  product: Product;
  quantity: number;
}
