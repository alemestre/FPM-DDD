import { adminGuard, adminLoginGuard } from '../../guards/admin.guard';
import { AdminLayout } from '../../layout/admin/admin-layout';
import { AuthLayout } from '../../layout/auth/auth-layout';
import { AdminLogin } from './login/admin-login';
import { AdminHome } from './home/admin-home';
import { Route } from '@angular/router';

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
          // Page admin inconnue : tableau de bord (le garde a déjà renvoyé les non-admins vers /admin/login).
          { path: '**', redirectTo: '' }
        ]
      }
    ]
  }
];
