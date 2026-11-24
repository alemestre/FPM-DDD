import { AuthService } from '../services/auth.service';
import { type CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const ADMIN_LOGIN_URL = '/admin/login';
export const ADMIN_HOME_URL = '/admin';

/**
 * Pages de l'espace admin : réservées à un admin connecté, les autres vont sur /admin/login.
 * La session est déjà restaurée avant la première navigation (provideAppInitializer).
 */
export const adminGuard: CanActivateFn = () =>
    inject(AuthService).isAdmin() ? true : inject(Router).parseUrl(ADMIN_LOGIN_URL);

/** /admin/login : un admin déjà connecté va directement sur son tableau de bord. */
export const adminLoginGuard: CanActivateFn = () =>
    inject(AuthService).isAdmin() ? inject(Router).parseUrl(ADMIN_HOME_URL) : true;
