import { createZodDto } from "nestjs-zod";
import { z } from "zod";

// Only the shape is checked here: the password rules belong to registration.
export const LoginSchema = z.object({
  email: z.string().trim().pipe(z.email()),
  password: z.string().min(1)
});

export class LoginDTO extends createZodDto(LoginSchema) {}
