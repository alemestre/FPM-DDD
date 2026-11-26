import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { GetCurrentUserUseCase } from '../../../application/use-cases/get-current-user.use-case';
import type { AuthenticatedRequest } from '../authenticated-request';
import { UserRole } from '@fpm/tools';

/**
 * Lets the request through only if the authenticated user is an active admin.
 * Must run after JwtCookieAuthGuard, which sets `request.user` to the user id:
 * use the OnlyAdmin decorator rather than this guard alone.
 * The role is read from the database, not from the token, so a demoted or
 * deactivated admin loses access immediately.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  private readonly logger = new Logger(AdminGuard.name);

  constructor(private readonly getCurrentUser: GetCurrentUserUseCase) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const userId = context.switchToHttp().getRequest<AuthenticatedRequest>().user;
    // Deleted or deactivated account: AuthenticationError, i.e. 401.
    const user = await this.getCurrentUser.execute(userId);

    if (user.role !== UserRole.ADMIN) {
      this.logger.warn(`Accès admin refusé à l'utilisateur ${userId}`);
      // false becomes a 403 Forbidden.
      return false;
    }
    return true;
  }
}
