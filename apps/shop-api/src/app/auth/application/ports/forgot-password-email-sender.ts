import type { User } from "../../domain/user.entity";

/** Sends the email that carries the link to choose a new password. */
export abstract class ForgotPasswordEmailSender {
  abstract send(user: User, token: string): Promise<void>;
}
