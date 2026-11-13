import type { User } from "../../domain/user.entity";

/** Sends the email that carries the verification link. */
export abstract class VerificationEmailSender {
  abstract send(user: User, token: string): Promise<void>;
}
