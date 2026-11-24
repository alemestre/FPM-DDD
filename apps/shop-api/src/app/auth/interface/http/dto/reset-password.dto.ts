import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "./register.dto";
import { createZodDto } from "nestjs-zod";
import { z } from "zod";

/** Shape of a password reset. The token is checked by the use case, the password rules by the domain. */
export const ResetPasswordSchema = z.strictObject({
  token: z.string().min(1),
  password: z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH)
});

export class ResetPasswordDTO extends createZodDto(ResetPasswordSchema) {}
