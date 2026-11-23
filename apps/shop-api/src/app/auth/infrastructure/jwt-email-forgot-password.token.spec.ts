import { InvalidVerificationTokenError } from '../domain/errors/invalid-verification-token.error';
import { JwtForgotPasswordToken, RESET_PASSWORD_TTL_SECONDS } from './jwt-email-forgot-password.token';
import type { UserCredentials } from '../domain/user.credentials';
import { User } from '../domain/user.entity';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'node:crypto';

const SECRET = 'test-secret';
const USER_ID = 'b1c2d3e4-5f60-4a7b-8c9d-0e1f2a3b4c5d';
const PASSWORD_HASH = '$argon2id$v=19$m=65536,t=3,p=4$ancien';

/** Recalculé ici, sans passer par l'adapter : sha256 du hash, en base64url, tronqué à 22 caractères. */
const fingerprintOf = (passwordHash: string) =>
  createHash('sha256').update(passwordHash).digest('base64url').slice(0, 22);

describe('JwtForgotPasswordToken', () => {
  const jwtService = new JwtService({ secret: SECRET, signOptions: { expiresIn: 24 * 3600 } });
  const tokens = new JwtForgotPasswordToken(jwtService);
  const user = User.reconstitute(USER_ID, 'marie.durand@example.fr', 'Marie', 'Durand', 'CUSTOMER', true, true);
  const credentials: UserCredentials = { user, passwordHash: PASSWORD_HASH };

  /** Simule le repository : renvoie les credentials actuels, quel que soit l'id demandé. */
  const currentCredentials = (current: UserCredentials | null = credentials) =>
    jest.fn<Promise<UserCredentials | null>, [string]>().mockResolvedValue(current);

  const validPayload = { sub: USER_ID, purpose: 'reset-password', pwd: fingerprintOf(PASSWORD_HASH) };

  it('émet un jeton valable 1 h, lié au mot de passe actuel, qui redonne les credentials', async () => {
    const token = await tokens.issue(credentials);
    const payload = jwtService.decode<{ sub: string; purpose: string; pwd: string; iat: number; exp: number }>(token);
    const findCredentials = currentCredentials();

    expect(payload).toMatchObject(validPayload);
    expect(payload.exp - payload.iat).toBe(RESET_PASSWORD_TTL_SECONDS);
    expect(RESET_PASSWORD_TTL_SECONDS).toBe(3600);
    await expect(tokens.verify(token, findCredentials)).resolves.toBe(credentials);
    expect(findCredentials).toHaveBeenCalledWith(USER_ID);
  });

  it("ne met pas le hash du mot de passe dans le jeton, qui est lisible par tous", async () => {
    const token = await tokens.issue(credentials);

    expect(JSON.stringify(jwtService.decode(token))).not.toContain(PASSWORD_HASH);
  });

  it('ne sert qu\'une fois : refusé dès que le mot de passe a changé', async () => {
    const token = await tokens.issue(credentials);
    const afterReset = currentCredentials({ user, passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$nouveau' });

    await expect(tokens.verify(token, afterReset)).rejects.toThrow(InvalidVerificationTokenError);
  });

  it("refuse un jeton dont l'utilisateur n'existe plus", async () => {
    const token = await tokens.issue(credentials);

    await expect(tokens.verify(token, currentCredentials(null))).rejects.toThrow(InvalidVerificationTokenError);
  });

  it.each([
    ['un jeton de session (sans usage)', () => jwtService.signAsync({ sub: USER_ID })],
    [
      "un jeton de vérification d'email",
      () => jwtService.signAsync({ ...validPayload, purpose: 'email-verification' }),
    ],
    ['un jeton sans identifiant', () => jwtService.signAsync({ ...validPayload, sub: undefined })],
    ['un jeton sans empreinte du mot de passe', () => jwtService.signAsync({ ...validPayload, pwd: undefined })],
    ['un jeton expiré', () => jwtService.signAsync(validPayload, { expiresIn: -60 })],
    ['un jeton signé avec un autre secret', () => new JwtService({ secret: 'autre' }).signAsync(validPayload)],
    ["une chaîne qui n'est pas un JWT", async () => 'n-importe-quoi'],
  ])('refuse %s', async (_case, makeToken) => {
    await expect(tokens.verify(await makeToken(), currentCredentials())).rejects.toThrow(
      InvalidVerificationTokenError,
    );
  });
});
