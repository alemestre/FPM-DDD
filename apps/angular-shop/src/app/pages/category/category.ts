import { NotificationService } from '../../services/notification.service';
import { CategoryProducts } from './products/category-products.component';
import type { CategoryResponseDto as CategoryDTO } from '@fpm/contracts';
import { CategoryService } from '../../services/category.service';
import { Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

@Component({
  selector: 'app-category',
  imports: [CategoryProducts],
  templateUrl: './category.html'
})
export class Category {
  private readonly notificationService = inject(NotificationService);
  private readonly categoriesService = inject(CategoryService);
  private readonly route = inject(ActivatedRoute);

  private readonly slug = toSignal(this.route.paramMap.pipe(map((params) => params.get('slug'))), {
    initialValue: null
  });

  private readonly categoryResource = this.categoriesService.categoryBySlugResource(this.slug);

  readonly category = computed<CategoryDTO | null>(() =>
    this.categoryResource.hasValue() ? this.categoryResource.value().data : null
  );

  readonly isLoading = computed(() => this.categoryResource.isLoading());

  readonly error = computed(() => (this.categoryResource.error() ? 'Une erreur est survenue.' : null));

  constructor() {
    effect(() => {
      const error = this.error();
      if (error)
        this.notificationService.showError(error);
    });
  }
}
