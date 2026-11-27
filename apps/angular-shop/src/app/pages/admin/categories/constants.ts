import type { CategoryResponseDto as Category } from '@fpm/contracts';
import type { EntitySpecs } from '../../../shared/CRUD/crud';


/** Rubrique catégories, partagée par la liste, la fiche et le formulaire. */
export const CATEGORY_SPECS: EntitySpecs<Category> = {
  name: 'catégorie',
  key: 'name',
  gender: 'F',
  basePath: 'categories'
};
