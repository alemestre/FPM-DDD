import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const CreateProducerSchema = z.object({
  name: z.string().min(1),
  contactEmail: z.string().trim().pipe(z.email()),
  phoneNumber: z.string(),
  vatNumber: z.string().min(13),
  addressLine1: z.string().min(1),
  addressLine2: z.string().default(""),
  postalCode: z.string().min(1),
  city: z.string().min(1)
});

export class CreateProducerDto extends createZodDto(CreateProducerSchema) {}
