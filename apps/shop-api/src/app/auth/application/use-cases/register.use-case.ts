import { PhoneNumber } from "../../../shared/domain/value-objects/phone-number.value-object";
import { PostalCode } from "../../../shared/domain/value-objects/postal-code.value-object";
import { DomainValidationError } from "../../../shared/domain/errors/domain-validation.error";
import type { CustomerAddress } from "../../domain/customer-registration";
import { VerificationEmailSender } from "../ports/verification-email-sender";
import { EmailVerificationToken } from "../ports/email-verification-token";
import type { RegisterAddressInput, RegisterInput } from "../register.input";
import { UserRepository } from "../../domain/user.repository";
import { PasswordHasher } from "../ports/password-hasher";
import { Password } from "../../domain/password.value-object";
import { User } from "../../domain/user.entity";
import { Inject } from "@nestjs/common";

/**
 * Creates a customer account, unverified, and emails it a verification link.
 * The account cannot log in until the link is followed.
 */
export class RegisterUseCase {
  constructor(
    @Inject(UserRepository) private readonly repository: UserRepository,
    @Inject(PasswordHasher) private readonly passwordHasher: PasswordHasher,
    @Inject(EmailVerificationToken) private readonly verificationToken: EmailVerificationToken,
    @Inject(VerificationEmailSender) private readonly emailSender: VerificationEmailSender
  ) {}

  async execute(input: RegisterInput): Promise<User> {
    // Every value object is built before hashing, so invalid input fails fast.
    const user = User.register(input);
    const phone = PhoneNumber.create(input.phone);
    const address = input.address ? toCustomerAddress(input.address) : undefined;
    const password = Password.create(input.password);

    const passwordHash = await this.passwordHasher.hash(password.value);
    await this.repository.register({ user, passwordHash, phone, address });

    const token = await this.verificationToken.issue(user);
    await this.emailSender.send(user, token);

    return user;
  }
}

function toCustomerAddress({ line1, line2, postalCode, city }: RegisterAddressInput): CustomerAddress {
  const trimmedLine1 = line1.trim();
  const trimmedCity = city.trim();
  if (!trimmedLine1 || !trimmedCity) {
    throw new DomainValidationError("L'adresse et la ville sont obligatoires lorsqu'une adresse est fournie");
  }
  return {
    line1: trimmedLine1,
    line2: line2?.trim() ?? "",
    postalCode: PostalCode.create(postalCode),
    city: trimmedCity
  };
}
