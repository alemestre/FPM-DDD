import { createZodDto } from "nestjs-zod";
import { z } from "zod";

/**
 * Partial update of the signed-in customer's profile. Phone and postal code
 * rules are enforced by the domain. Unknown fields, including `email`, are
 * rejected. The address can be replaced but not removed (`null` is rejected).
 */
export const UpdateCustomerProfileSchema = z
  .strictObject({
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    phone: z.string().trim().min(1),
    address: z
      .strictObject({
        line1: z.string().trim().min(1),
        line2: z.string().trim().optional(),
        postalCode: z.string().trim().min(1),
        city: z.string().trim().min(1)
      })
  })
  .partial();

export class UpdateCustomerProfileDto extends createZodDto(UpdateCustomerProfileSchema) {}
