import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const VerifyEmailSchema = z.object({
  token: z.string().min(1)
});

export class VerifyEmailDTO extends createZodDto(VerifyEmailSchema) {}
