import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const ResendVerificationSchema = z.object({
  email: z.string().trim().pipe(z.email())
});

export class ResendVerificationDTO extends createZodDto(ResendVerificationSchema) {}
