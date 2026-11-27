import { categoriesComponent } from './categories/categories.component';
import { adminGuard, adminLoginGuard } from '../../guards/admin.guard';
import { producersComponent } from './producers/producers.component';
import { AdminPlaceholder } from './placeholder/admin-placeholder';
import { AdminLayout } from '../../layout/admin/admin-layout';
import { AuthLayout } from '../../layout/auth/auth-layout';
import { AdminLogin } from './login/admin-login';
import { AdminHome } from './home/admin-home';
import { Route } from '@angular/router';

/** Charge une page à la demande : `() => import('./list/…').then((m) => m.MaPage)`. */
type LoadComponent = NonNullable<Route['loadComponent']>;

/** Pages CRUD d'une rubrique, chargées à la demande (chacune dans son propre chunk). */
export type CrudLoadComponent = {
  list: LoadComponent;
  create: LoadComponent;
  read: LoadComponent;
  update: LoadComponent;
};

/**
 * Routes CRUD d'une rubrique : liste, ajout, fiche, modification. La suppression est une action
 * de la liste ou de la fiche, pas une route. Sans `pages`, pages provisoires (AdminPlaceholder).
 */
const crudRoutes = (path: string, label: string, pages?: CrudLoadComponent): Route => {
  const page = (loadComponent: LoadComponent | undefined) =>
    loadComponent ? { loadComponent } : { component: AdminPlaceholder };
  return {
    path,
    children: [
      { path: '', ...page(pages?.list), data: { breadcrumb: label } },
      { path: 'nouveau', ...page(pages?.create), data: { breadcrumb: `${label} — Nouveau` } },
      { path: ':id', ...page(pages?.read), data: { breadcrumb: `${label} — Fiche` } },
      { path: ':id/modifier', ...page(pages?.update), data: { breadcrumb: `${label} — Modifier` } }
    ]
  };
};

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
          crudRoutes('categories', 'Catégories', categoriesComponent),
          crudRoutes('producteurs', 'Producteurs', producersComponent),
          crudRoutes('commandes', 'Commandes'),
          crudRoutes('utilisateurs', 'Utilisateurs'),
          // Page admin inconnue : tableau de bord (le garde a déjà renvoyé les non-admins vers /admin/login).
          { path: '**', redirectTo: '' }
        ]
      }
    ]
  }
];
