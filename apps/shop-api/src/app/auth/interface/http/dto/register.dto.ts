import { createZodDto } from "nestjs-zod";
import { z } from "zod";

/** Argon2 hashes any length, but an unbounded password is a cheap way to burn CPU. */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

/**
 * Shape of a registration request. Phone, postal code and name rules are
 * enforced by the domain; the address is optional, but all-or-nothing.
 */
export const RegisterSchema = z
  .object({
    email: z.string().trim().pipe(z.email()),
    password: z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH),
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    phone: z.string().trim().min(1),
    addressLine1: z.string().trim().min(1).optional(),
    addressLine2: z.string().trim().optional(),
    postalCode: z.string().trim().min(1).optional(),
    city: z.string().trim().min(1).optional()
  })
  .superRefine((value, context) => {
    const required = ["addressLine1", "postalCode", "city"] as const;
    const hasAddress = required.some((field) => value[field] !== undefined) || Boolean(value.addressLine2);
    if (!hasAddress) {
      return;
    }
    for (const field of required) {
      if (value[field] === undefined) {
        context.addIssue({
          code: "custom",
          path: [field],
          message: "Obligatoire lorsqu'une adresse est fournie"
        });
      }
    }
  });

export class RegisterDTO extends createZodDto(RegisterSchema) {}
