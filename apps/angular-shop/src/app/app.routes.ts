import { CHECKOUT_IDENTIFICATION_URL, checkoutMatch, identificationGuard } from './guards/checkout-access.guard';
import { VerifyEmail } from './pages/auth/verify-email/verify-email';
import { Register } from './pages/auth/register/register';
import { MainLayout } from './layout/main/main-layout';
import { AuthLayout } from './layout/auth/auth-layout';
import { Category } from './pages/category/category';
import { Profile } from './pages/profile/profile';
import { Login } from './pages/auth/login/login';
import { About } from './pages/about/about';
import { Home } from './pages/home/home';
import { Route } from '@angular/router';
import { authGuard } from './guards/auth.guard';

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
          },
          {
            path: 'checkout',
            canMatch: [checkoutMatch],
            loadComponent: () => import('./pages/checkout/summary/checkout-summary').then(m => m.CheckoutSummary),
            data: { breadcrumb: 'Commande' }
          },
          {
            // Ni connecté ni invité : choisir d'abord.
            path: 'checkout',
            pathMatch: 'full',
            redirectTo: CHECKOUT_IDENTIFICATION_URL
          },
          {
            path: 'checkout/identification',
            canActivate: [identificationGuard],
            loadComponent: () => import('./pages/checkout/identification/identification').then(m => m.Identification),
            data: { breadcrumb: 'Identification' }
          },
          {
            path: 'checkout/confirmation',
            loadComponent: () => import('./pages/checkout/confirmation/confirmation').then(m => m.Confirmation),
            data: { breadcrumb: 'Confirmation' }
          },
          {
            path: 'profil',
            component: Profile,
            canActivate: [authGuard],
            data: { breadcrumb: 'Profil' }
          },
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
