import { type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtCookieAuthGuard } from './jwt-cookie-auth.guard';
import { JwtService } from '@nestjs/jwt';

const SECRET = 'test-secret';
const USER_ID = 'b1c2d3e4-5f60-4a7b-8c9d-0e1f2a3b4c5d';

describe('JwtCookieAuthGuard', () => {
  const jwtService = new JwtService({ secret: SECRET });
  const guard = new JwtCookieAuthGuard(jwtService);

  const contextWith = (cookies: Record<string, string> | undefined) => {
    const request: Record<string, unknown> = { cookies };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
    return { request, context };
  };

  it("laisse passer un jeton valide et expose l'id de l'utilisateur", async () => {
    const token = await jwtService.signAsync({ sub: USER_ID });
    const { request, context } = contextWith({ access_token: token });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request['authenticatedUserId']).toBe(USER_ID);
  });

  it('refuse une requête sans cookie', async () => {
    await expect(guard.canActivate(contextWith(undefined).context)).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(guard.canActivate(contextWith({}).context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('refuse un jeton signé avec un autre secret', async () => {
    const token = await new JwtService({ secret: 'autre-secret' }).signAsync({ sub: USER_ID });

    await expect(guard.canActivate(contextWith({ access_token: token }).context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('refuse un jeton expiré', async () => {
    const token = await jwtService.signAsync({ sub: USER_ID, exp: Math.floor(Date.now() / 1000) - 60 });

    await expect(guard.canActivate(contextWith({ access_token: token }).context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('refuse un jeton sans identifiant utilisateur', async () => {
    const token = await jwtService.signAsync({ role: 'CUSTOMER' });

    await expect(guard.canActivate(contextWith({ access_token: token }).context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('refuse un cookie qui ne contient pas un JWT', async () => {
    await expect(guard.canActivate(contextWith({ access_token: 'n-importe-quoi' }).context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("refuse un jeton signé pour un autre usage, comme le lien de vérification d'email", async () => {
    const token = await jwtService.signAsync({ sub: USER_ID, purpose: 'email-verification' });

    await expect(guard.canActivate(contextWith({ access_token: token }).context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
