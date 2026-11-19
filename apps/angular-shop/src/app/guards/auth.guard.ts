import { AuthService } from '../services/auth.service';
import { type CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isConnected()) {
        return true;
    }

    return router.parseUrl('/login');
}
