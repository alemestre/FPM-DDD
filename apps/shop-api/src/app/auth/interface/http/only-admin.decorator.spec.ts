import { GUARDS_METADATA } from '@nestjs/common/constants';
import { JwtCookieAuthGuard } from './guards/jwt-cookie-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { OnlyAdmin } from './only-admin.decorator';

// @nestjs/config est publié en ESM, que ts-jest ne charge pas : la stratégie JWT n'en utilise que le type.
jest.mock('@nestjs/config', () => ({ ConfigService: class ConfigService {} }));

describe('OnlyAdmin', () => {
  it("vérifie la session avant le rôle, pour qu'AdminGuard reçoive l'id de l'utilisateur", () => {
    @OnlyAdmin()
    class AdminController {}

    expect(Reflect.getMetadata(GUARDS_METADATA, AdminController)).toEqual([JwtCookieAuthGuard, AdminGuard]);
  });
});
