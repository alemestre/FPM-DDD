import type { Prisma } from "../../../generated/prisma/client";
import { CustomerAddress } from "../domain/customer-address.value-object";
import { CustomerRepository } from "../domain/customer.repository";
import { PrismaService } from "../../../prisma/prisma.service";
import { Customer } from "../domain/customer.entity";
import { Injectable } from "@nestjs/common";

/** Names and email live on the user row, contact details on the customer row. */
const CUSTOMER_INCLUDE = {
  user: { select: { email: true, firstName: true, lastName: true } }
} as const satisfies Prisma.CustomerInclude;

type CustomerRow = Prisma.CustomerGetPayload<{ include: typeof CUSTOMER_INCLUDE }>;

@Injectable()
export class PrismaCustomerRepository implements CustomerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Customer | null> {
    const row = await this.prisma.customer.findUnique({
      where: { id },
      include: CUSTOMER_INCLUDE
    });

    return row ? this.toDomain(row) : null;
  }

  /** The profile spans two tables: both are written in one transaction. */
  async save(customer: Customer): Promise<void> {
    const { address } = customer;

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: customer.id },
        data: { firstName: customer.firstName, lastName: customer.lastName }
      }),
      this.prisma.customer.update({
        where: { id: customer.id },
        data: {
          phone: customer.phone,
          addressLine1: address.line1,
          addressLine2: address.line2,
          postalCode: address.postalCode,
          city: address.city
        }
      })
    ]);
  }

  private toDomain(row: CustomerRow): Customer {
    const { addressLine1, addressLine2, postalCode, city } = row;
    const address = CustomerAddress.create({ line1: addressLine1, line2: addressLine2, postalCode, city });

    return Customer.reconstitute(row.id, row.user.email, row.user.firstName, row.user.lastName, row.phone, address);
  }
}
