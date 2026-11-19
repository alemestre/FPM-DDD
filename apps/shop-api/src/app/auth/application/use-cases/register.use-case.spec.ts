import { DomainValidationError } from '../../../shared/domain/errors/domain-validation.error';
import { EmailAlreadyUsedError } from '../../domain/errors/email-already-used.error';
import type { VerificationEmailSender } from '../ports/verification-email-sender';
import type { EmailVerificationToken } from '../ports/email-verification-token';
import type { UserRepository } from '../../domain/user.repository';
import type { PasswordHasher } from '../ports/password-hasher';
import type { RegisterInput } from '../register.input';
import { RegisterUseCase } from './register.use-case';

const INPUT: RegisterInput = {
  email: '  Marie.Durand@Example.FR ',
  password: 'MotDePasse1!',
  firstName: ' Marie ',
  lastName: 'Durand',
  phone: '06 12 34 56 78',
  address: { line1: ' 1 rue des Lilas ', postalCode: '75 001', city: 'Paris' },
};

describe('RegisterUseCase', () => {
  let repository: jest.Mocked<UserRepository>;
  let passwordHasher: jest.Mocked<PasswordHasher>;
  let verificationToken: jest.Mocked<EmailVerificationToken>;
  let emailSender: jest.Mocked<VerificationEmailSender>;
  let useCase: RegisterUseCase;

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      findCredentialsByEmail: jest.fn(),
      findCredentialsById: jest.fn(),
      register: jest.fn(),
      save: jest.fn(),
      savePasswordHash: jest.fn(),
    };
    passwordHasher = { hash: jest.fn().mockResolvedValue('$argon2id$hash'), verify: jest.fn() };
    verificationToken = { issue: jest.fn().mockResolvedValue('verification.jwt'), verify: jest.fn() };
    emailSender = { send: jest.fn() };
    useCase = new RegisterUseCase(repository, passwordHasher, verificationToken, emailSender);
  });

  it('crée un compte client non vérifié, avec le mot de passe haché', async () => {
    const user = await useCase.execute(INPUT);

    expect(user).toMatchObject({
      email: 'marie.durand@example.fr',
      firstName: 'Marie',
      lastName: 'Durand',
      role: 'CUSTOMER',
      isActive: true,
      emailVerified: false,
    });
    expect(passwordHasher.hash).toHaveBeenCalledWith('MotDePasse1!');

    const registration = repository.register.mock.calls[0][0];
    expect(registration.user).toBe(user);
    expect(registration.passwordHash).toBe('$argon2id$hash');
    expect(registration.phone.toString()).toBe('+33612345678');
    expect(registration.address).toMatchObject({ line1: '1 rue des Lilas', line2: '', city: 'Paris' });
    expect(registration.address.postalCode.toString()).toBe('75001');
  });

  it("envoie l'email de vérification avec un jeton émis pour le nouveau compte", async () => {
    const user = await useCase.execute(INPUT);

    expect(verificationToken.issue).toHaveBeenCalledWith(user);
    expect(emailSender.send).toHaveBeenCalledWith(user, 'verification.jwt');
  });

  it("enregistre le complément d'adresse quand il est fourni", async () => {
    await useCase.execute({ ...INPUT, address: { ...INPUT.address, line2: ' Bât. B ' } });

    expect(repository.register.mock.calls[0][0].address.line2).toBe('Bât. B');
  });

  it.each([
    ['un téléphone invalide', { ...INPUT, phone: '123' }],
    ['un code postal invalide', { ...INPUT, address: { line1: '1 rue des Lilas', postalCode: 'ABC', city: 'Paris' } }],
    ['une adresse vide', { ...INPUT, address: { line1: '  ', postalCode: '75001', city: 'Paris' } }],
    ['une ville vide', { ...INPUT, address: { line1: '1 rue des Lilas', postalCode: '75001', city: ' ' } }],
    ['un prénom vide', { ...INPUT, firstName: '  ' }],
    ['un email invalide', { ...INPUT, email: 'pas-un-email' }],
    ['un mot de passe sans majuscule, chiffre ni caractère spécial', { ...INPUT, password: 'motdepasse' }],
  ])('refuse %s sans rien enregistrer ni envoyer', async (_case, input) => {
    await expect(useCase.execute(input)).rejects.toThrow(DomainValidationError);
    expect(passwordHasher.hash).not.toHaveBeenCalled();
    expect(repository.register).not.toHaveBeenCalled();
    expect(emailSender.send).not.toHaveBeenCalled();
  });

  it("n'envoie pas d'email si l'adresse est déjà utilisée", async () => {
    repository.register.mockRejectedValue(new EmailAlreadyUsedError());

    await expect(useCase.execute(INPUT)).rejects.toThrow(EmailAlreadyUsedError);
    expect(verificationToken.issue).not.toHaveBeenCalled();
    expect(emailSender.send).not.toHaveBeenCalled();
  });
});
