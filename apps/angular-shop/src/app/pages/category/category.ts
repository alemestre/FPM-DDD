import { NotificationService } from '../../services/notification.service';
import { CategoryProducts } from './products/category-products.component';
import type { CategoryResponseDto as CategoryDTO } from '@fpm/contracts';
import { CategoriesService } from '../../services/categories.service';
import { Component, computed, effect, inject } from '@angular/core';
import { catchError, map, of, switchMap } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';


interface CategoryState {
  category: CategoryDTO | null;
  loading: boolean;
  error: string | null;
}

const INITIAL_STATE: CategoryState = {
  category: null,
  loading: true,
  error: null
};

@Component({
  selector: 'app-category',
  imports: [CategoryProducts],
  templateUrl: './category.html'
})
export class Category {
  private readonly notificationService = inject(NotificationService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly route = inject(ActivatedRoute);

  private readonly state = toSignal(
    this.route.paramMap.pipe(
      map(params => params.get('slug')),
      switchMap(slug => {
        if (!slug) {
          return of({
            ...INITIAL_STATE,
            loading: false
          });
        }
        return this.categoriesService.getCategoryBySlug(slug).pipe(
          map(category => ({
            category,
            loading: false,
            error: null
          })),
          catchError(() =>
            of({
              category: null,
              loading: false,
              error: 'Une erreur est survenue.'
            })
          )
        );
      })
    ),
    { initialValue: INITIAL_STATE }
  );

  readonly category = computed(() => this.state().category);

  readonly isLoading = computed(() => this.state().loading);

  readonly error = computed(() => this.state().error);

  constructor() {
    effect(() => {
      const error = this.error();
      console.log("l'erreur: ", error)
      if (error)
        this.notificationService.showError(error);
    });
  }
}
