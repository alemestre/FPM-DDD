import { CreateProducerSchema } from "./create-producer.dto";
import { createZodDto } from "nestjs-zod";
import { z } from "zod";

/**
 * Partial update. Unknown fields (including `isActive`) are rejected: activation
 * goes through the dedicated activate / deactivate endpoints.
 */
export const UpdateProducerSchema = z
  .strictObject({
    ...CreateProducerSchema.omit({ addressLine2: true }).shape,
    addressLine2: z.string().optional()
  })
  .partial();

export class UpdateProducerDto extends createZodDto(UpdateProducerSchema) {}
