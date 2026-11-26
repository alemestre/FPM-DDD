import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CategoryService } from '../../../../services/category.service';
import type { CategoryResponseDto as Category, CategoryRequestDto } from '@fpm/contracts';
import { EntityList } from '../../../../shared/CRUD/entity-list';
import { CATEGORY_SPECS } from '../constants';
import { RouterLink } from '@angular/router';

/** /admin/categories : liste des catégories, avec accès à la fiche, à la modification et à la suppression. */
@Component({
  selector: 'app-admin-category-list',
  imports: [RouterLink],
  templateUrl: './admin-category-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminCategoryList extends EntityList<Category, CategoryRequestDto> {
  protected readonly entityService = inject(CategoryService);
  protected readonly entitiesResource = this.entityService.adminEntitiesResource();
  protected readonly entitySpecs = CATEGORY_SPECS;
}
