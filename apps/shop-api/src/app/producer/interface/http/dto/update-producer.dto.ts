import { CreateProducerSchema } from "./create-producer.dto";
import { createZodDto } from "nestjs-zod";
import { z } from "zod";

/**
 * Partial update. Unknown fields are rejected. `isActive` can be changed here as well as
 * through the activate / deactivate endpoints.
 */
export const UpdateProducerSchema = z
  .strictObject({
    ...CreateProducerSchema.omit({ addressLine2: true }).shape,
    addressLine2: z.string().optional(),
    isActive: z.boolean().optional()
  })
  .partial();

export class UpdateProducerDto extends createZodDto(UpdateProducerSchema) {}
