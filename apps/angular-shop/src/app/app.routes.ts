import { Route } from '@angular/router';
import { Home } from './pages/home/home';
import { About } from './pages/about/about';
import { Products } from './pages/products/products';

export const appRoutes: Route[] = [
  {
    path: '',
    children: [
      // {
      //   path: "",
      //   canActivate: [isAuthenticatedGuard],
      //   children: buildAuthenticatedRoutes(options)
      // },
      {
        path: '',
        // canActivate: [isNotAuthenticatedGuard],
        children: [
          {
            path: '',
            redirectTo: '/home',
            pathMatch: 'full'
          },
          {
            path: 'home',
            component: Home,
            data: { breadcrumb: 'Accueil' }
          },
          {
            path: 'about',
            component: About,
            data: { breadcrumb: 'À propos' }
          },
          {
            path: 'products/:id',
            component: Products,
            data: { breadcrumb: 'Produits' }
          }
        ]
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/home'
  }
];
