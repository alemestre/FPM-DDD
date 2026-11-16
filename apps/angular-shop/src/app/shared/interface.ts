import type { ProductWithProducerResponseDto as Product } from '@fpm/contracts';

export interface ProductsState {
    products: Product[];
    loading: boolean;
    error: string | null;
}
