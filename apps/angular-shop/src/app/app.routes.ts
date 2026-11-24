import { CHECKOUT_IDENTIFICATION_URL, checkoutMatch, identificationGuard } from './guards/checkout-access.guard';
import { ForgotPassword } from './pages/auth/forgot-password/forgot-password';
import { ResetPassword } from './pages/auth/reset-password/reset-password';
import { VerifyEmail } from './pages/auth/verify-email/verify-email';
import { appAdminRoutes } from './pages/admin/admin.routes';
import { Register } from './pages/auth/register/register';
import { MainLayout } from './layout/main/main-layout';
import { AuthLayout } from './layout/auth/auth-layout';
import { Category } from './pages/category/category';
import { Profile } from './pages/profile/profile';
import { Login } from './pages/auth/login/login';
import { authGuard } from './guards/auth.guard';
import { About } from './pages/about/about';
import { Home } from './pages/home/home';
import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  ...appAdminRoutes,
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
          {
            path: 'profil/commandes/:id',
            canActivate: [authGuard],
            loadComponent: () =>
              import('./pages/profile/orders/order-detail/order-detail').then(m => m.OrderDetail),
            data: { breadcrumb: 'Détail de la commande' }
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
        path: 'mot-de-passe-oublie',
        component: ForgotPassword,
        data: { breadcrumb: 'Mot de passe oublié' }
      },
       {
        path: 'reinitialiser-mot-de-passe',
        component: ResetPassword,
        data: { breadcrumb: 'Réinitialiser mot de passe' }
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

