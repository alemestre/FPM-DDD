import type { CrudLoadComponent } from '../admin.routes';

// Imports dynamiques à chemin littéral : le bundler place chaque page dans son propre chunk,
// hors du bundle initial. `import type` évite une dépendance circulaire avec admin.routes.ts.
export const categoriesComponent: CrudLoadComponent = {
  list: () => import('./list/admin-category-list').then((m) => m.AdminCategoryList),
  create: () => import('./form/admin-category-form').then((m) => m.AdminCategoryForm),
  read: () => import('./detail/admin-category-detail').then((m) => m.AdminCategoryDetail),
  update: () => import('./form/admin-category-form').then((m) => m.AdminCategoryForm)
};
