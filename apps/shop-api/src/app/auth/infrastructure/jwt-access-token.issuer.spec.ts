import { JwtAccessTokenIssuer } from './jwt-access-token.issuer';
import { User } from '../domain/user.entity';
import { JwtService } from '@nestjs/jwt';

const USER_ID = 'b1c2d3e4-5f60-4a7b-8c9d-0e1f2a3b4c5d';

describe('JwtAccessTokenIssuer', () => {
  const jwtService = new JwtService({ secret: 'test-secret', signOptions: { expiresIn: 3600 } });
  const issuer = new JwtAccessTokenIssuer(jwtService);
  const user = User.reconstitute(USER_ID, 'marie.durand@example.fr', 'Marie', 'Durand', 'CUSTOMER', true, true);

  it("émet un jeton signé, à durée limitée, qui ne porte que l'id de l'utilisateur", async () => {
    const token = await issuer.issue(user);
    const payload = await jwtService.verifyAsync<Record<string, unknown>>(token);

    expect(payload['sub']).toBe(USER_ID);
    expect(payload['exp']).toBe((payload['iat'] as number) + 3600);
    expect(Object.keys(payload).sort()).toEqual(['exp', 'iat', 'sub']);
  });
});
