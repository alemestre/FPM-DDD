import { InvalidVerificationTokenError } from '../domain/errors/invalid-verification-token.error';
import { EMAIL_VERIFICATION_TTL_SECONDS, JwtEmailVerificationToken } from './jwt-email-verification.token';
import { User } from '../domain/user.entity';
import { JwtService } from '@nestjs/jwt';

const SECRET = 'test-secret';
const USER_ID = 'b1c2d3e4-5f60-4a7b-8c9d-0e1f2a3b4c5d';

describe('JwtEmailVerificationToken', () => {
  const jwtService = new JwtService({ secret: SECRET, signOptions: { expiresIn: 3600 } });
  const tokens = new JwtEmailVerificationToken(jwtService);
  const user = User.reconstitute(USER_ID, 'marie.durand@example.fr', 'Marie', 'Durand', 'CUSTOMER', true, false);

  it("émet un jeton valable 24 h qui redonne l'id de l'utilisateur", async () => {
    const token = await tokens.issue(user);
    const payload = jwtService.decode<{ sub: string; purpose: string; iat: number; exp: number }>(token);

    expect(payload).toMatchObject({ sub: USER_ID, purpose: 'email-verification' });
    expect(payload.exp - payload.iat).toBe(EMAIL_VERIFICATION_TTL_SECONDS);
    await expect(tokens.verify(token)).resolves.toBe(USER_ID);
  });

  it.each([
    ['un jeton de session (sans usage)', () => jwtService.signAsync({ sub: USER_ID })],
    ['un jeton pour un autre usage', () => jwtService.signAsync({ sub: USER_ID, purpose: 'password-reset' })],
    ['un jeton sans identifiant', () => jwtService.signAsync({ purpose: 'email-verification' })],
    [
      'un jeton expiré',
      () =>
        jwtService.signAsync({ sub: USER_ID, purpose: 'email-verification' }, { expiresIn: -60 }),
    ],
    [
      'un jeton signé avec un autre secret',
      () => new JwtService({ secret: 'autre' }).signAsync({ sub: USER_ID, purpose: 'email-verification' }),
    ],
    ["une chaîne qui n'est pas un JWT", async () => 'n-importe-quoi'],
  ])('refuse %s', async (_case, makeToken) => {
    await expect(tokens.verify(await makeToken())).rejects.toThrow(InvalidVerificationTokenError);
  });
});
