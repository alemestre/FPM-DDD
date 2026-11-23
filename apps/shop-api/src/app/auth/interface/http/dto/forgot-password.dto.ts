import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const ForgotPasswordSchema = z.object({
  email: z.string().trim().pipe(z.email()),
});

export class ForgotPasswordDTO extends createZodDto(ForgotPasswordSchema) {}
