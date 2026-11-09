import { Argon2PasswordHasher } from './argon2-password-hasher';

describe('Argon2PasswordHasher', () => {
  const hasher = new Argon2PasswordHasher();

  it('produit un hash argon2id que verify accepte pour le bon mot de passe', async () => {
    const hash = await hasher.hash('motdepasse');

    expect(hash).toMatch(/^\$argon2id\$/);
    expect(hash).not.toContain('motdepasse');
    await expect(hasher.verify('motdepasse', hash)).resolves.toBe(true);
  });

  it('refuse un mauvais mot de passe', async () => {
    const hash = await hasher.hash('motdepasse');

    await expect(hasher.verify('mauvais', hash)).resolves.toBe(false);
  });

  it("refuse toujours quand il n'y a pas de hash (compte inconnu)", async () => {
    await expect(hasher.verify('motdepasse', null)).resolves.toBe(false);
    await expect(hasher.verify('unknown-account-placeholder', null)).resolves.toBe(false);
  });

  it('refuse un hash mal formé au lieu de lever une exception', async () => {
    await expect(hasher.verify('motdepasse', 'pas-un-hash')).resolves.toBe(false);
  });
});
