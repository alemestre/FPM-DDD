import { Route } from '@angular/router';
import { Home } from './pages/home/home';
import { About } from './pages/about/about';
import { Category } from './pages/category/category';
import { Login } from './pages/auth/login/login';
import { Register } from './pages/auth/register/register';
import { VerifyEmail } from './pages/auth/verify-email/verify-email';
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
            component: Category,
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
      },
      {
        // Lien envoyé par l'API dans l'e-mail de vérification : /verifier-email?token=…
        path: 'verifier-email',
        component: VerifyEmail,
        data: { breadcrumb: 'Vérification de l’e-mail' }
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/home'
  }
];
