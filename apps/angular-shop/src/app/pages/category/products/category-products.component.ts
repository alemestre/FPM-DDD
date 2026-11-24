import { ProductCard } from './product-card/product-card';
import type { CategoryResponseDto as Category } from '@fpm/contracts';
import { Products } from '../../../shared/abstract-products';
import { TitleCasePipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';

@Component({
    selector: 'app-products',
    imports: [ProductCard, TitleCasePipe],
    templateUrl: './category-products.component.html',
})
export class CategoryProducts extends Products {
    category = input.required<Category>();

    protected readonly productsResource = this.productsService.activeProductsByCategoryResource(
        computed(() => this.category().id),
    );
}
