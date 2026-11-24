import { createZodDto } from "nestjs-zod";
import { z } from "zod";

/** Body of a password reset link check. The token itself is checked by the use case. */
export const VerifyForgotPasswordTokenSchema = z.strictObject({
  token: z.string().min(1)
});

export class VerifyForgotPasswordTokenDTO extends createZodDto(VerifyForgotPasswordTokenSchema) {}
