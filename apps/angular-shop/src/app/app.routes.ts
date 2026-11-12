import { Route } from '@angular/router';
import { Home } from './pages/home/home';
import { About } from './pages/about/about';
import { Products } from './pages/products/products';
import { Login } from './pages/auth/login/login';
import { Register } from './pages/auth/register/register';
import { MainLayout } from './layout/main/main-layout';
import { AuthLayout } from './layout/auth/auth-layout';

export const appRoutes: Route[] = [
  {
    path: '',
    component: MainLayout,
    children: [
      {
        path: '',
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
            path: 'a-propos',
            component: About,
            data: { breadcrumb: 'À propos' }
          },
          {
            path: 'produits/:slug',
            component: Products,
            data: { breadcrumb: 'Produits' }
          },
          {
            path: 'panier',
            loadComponent: () => import('./pages/cart/cart').then(m => m.CartComponent)
          }
        ]
      }
    ]
  },
  {
    path: "",
    component: AuthLayout,
    children: [
      {
        path: 'login',
        component: Login,
        data: { breadcrumb: 'Connexion' }
      },
      {
        path: 'register',
        component: Register,
        data: { breadcrumb: 'Inscription' }
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/home'
  }
];
