import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CategoryService } from '../../../../services/category.service';
import type { CategoryResponseDto as Category, CategoryRequestDto } from '@fpm/contracts';
import { EntityDetail } from '../../../../shared/CRUD/entity-detail';
import { CATEGORY_SPECS } from '../constants';
import { RouterLink } from '@angular/router';

/** /admin/categories/:id : fiche d'une catégorie. */
@Component({
  selector: 'app-admin-category-detail',
  imports: [RouterLink],
  templateUrl: './admin-category-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminCategoryDetail extends EntityDetail<Category, CategoryRequestDto> {
  protected readonly entityService = inject(CategoryService);
  protected readonly entityResource = this.entityService.adminEntityResource(this.id);
  protected readonly entitySpecs = CATEGORY_SPECS;
}
