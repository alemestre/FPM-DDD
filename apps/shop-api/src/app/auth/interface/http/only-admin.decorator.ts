import { JwtCookieAuthGuard } from './guards/jwt-cookie-auth.guard';
import { applyDecorators, UseGuards } from '@nestjs/common';
import { AdminGuard } from './guards/admin.guard';

/**
 * Restricts a route or a controller to admins: 401 without a valid session
 * (or if the account no longer exists or is deactivated), 403 for a non-admin.
 * The modules using it must import AuthModule.
 */
export const OnlyAdmin = () => applyDecorators(UseGuards(JwtCookieAuthGuard, AdminGuard));
