import { adminGuard, adminLoginGuard } from '../../guards/admin.guard';
import { AdminLayout } from '../../layout/admin/admin-layout';
import { AuthLayout } from '../../layout/auth/auth-layout';
import { AdminLogin } from './login/admin-login';
import { AdminPlaceholder } from './placeholder/admin-placeholder';
import { AdminHome } from './home/admin-home';
import { Route } from '@angular/router';

/**
 * Routes CRUD d'une rubrique : liste, ajout, fiche, modification. La suppression est une action
 * de la liste ou de la fiche, pas une route. Pages provisoires tant que la rubrique n'a pas ses écrans.
 */
const crudRoutes = (path: string, label: string): Route => ({
  path,
  children: [
    { path: '', component: AdminPlaceholder, data: { breadcrumb: label } },
    { path: 'nouveau', component: AdminPlaceholder, data: { breadcrumb: `${label} — Nouveau` } },
    { path: ':id', component: AdminPlaceholder, data: { breadcrumb: `${label} — Fiche` } },
    { path: ':id/modifier', component: AdminPlaceholder, data: { breadcrumb: `${label} — Modifier` } }
  ]
});

/**
 * Espace admin. Déclaré avant les routes de la boutique, pour que leur `**` ne capte pas /admin/….
 * - /admin/login : formulaire de connexion ; un admin déjà connecté va sur le tableau de bord.
 * - /admin et toute autre page /admin/… : réservées à un admin connecté, sinon /admin/login.
 */
export const appAdminRoutes: Route[] = [
  {
    path: 'admin',
    children: [
      {
        path: 'login',
        component: AuthLayout,
        canActivate: [adminLoginGuard],
        children: [{ path: '', component: AdminLogin }]
      },
      {
        path: '',
        component: AdminLayout,
        canActivate: [adminGuard],
        children: [
          { path: '', component: AdminHome, data: { breadcrumb: 'Tableau de bord' } },
          crudRoutes('produits', 'Produits'),
          {
            path: 'categories',
            children: [
              {
                path: '',
                loadComponent: () => import('./categories/list/admin-category-list').then((m) => m.AdminCategoryList),
                data: { breadcrumb: 'Catégories' }
              },
              {
                path: 'nouveau',
                loadComponent: () => import('./categories/form/admin-category-form').then((m) => m.AdminCategoryForm),
                data: { breadcrumb: 'Nouvelle catégorie' }
              },
              {
                path: ':id',
                loadComponent: () => import('./categories/detail/admin-category-detail').then((m) => m.AdminCategoryDetail),
                data: { breadcrumb: 'Catégorie' }
              },
              {
                path: ':id/modifier',
                loadComponent: () => import('./categories/form/admin-category-form').then((m) => m.AdminCategoryForm),
                data: { breadcrumb: 'Modifier la catégorie' }
              }
            ]
          },
          crudRoutes('producteurs', 'Producteurs'),
          crudRoutes('commandes', 'Commandes'),
          crudRoutes('utilisateurs', 'Utilisateurs'),
          // Page admin inconnue : tableau de bord (le garde a déjà renvoyé les non-admins vers /admin/login).
          { path: '**', redirectTo: '' }
        ]
      }
    ]
  }
];
