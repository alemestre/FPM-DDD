import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "./register.dto";
import { createZodDto } from "nestjs-zod";
import { z } from "zod";

/** Shape of a password change. The full rules of the new password are enforced by the domain. */
export const ChangePasswordSchema = z.strictObject({
  currentPassword: z.string().min(1).max(PASSWORD_MAX_LENGTH),
  newPassword: z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH)
});

export class ChangePasswordDTO extends createZodDto(ChangePasswordSchema) {}
