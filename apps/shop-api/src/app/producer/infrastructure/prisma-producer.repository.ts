import type { Producer as ProducerRow } from "../../../generated/prisma/client";
import { ProducerRepository } from "../domain/producer.repository";
import { PrismaService } from "../../../prisma/prisma.service";
import { Injectable, NotFoundException } from "@nestjs/common";
import { Producer } from "../domain/producer.entity";

/**
 * Producer scalars copied between the domain aggregate and Prisma,
 * keyed by domain property and mapped to the Prisma column.
 */
const PRODUCER_FIELD_TO_COLUMN = {
  name: "name",
  email: "email",
  phone: "phone",
  vatNumber: "tvaNumber",
  addressLine1: "addressLine1",
  addressLine2: "addressLine2",
  postalCode: "postalCode",
  city: "city"
} as const satisfies Partial<Record<keyof Producer, keyof ProducerRow>>;

type ProducerField = keyof typeof PRODUCER_FIELD_TO_COLUMN;
type ProducerColumn = (typeof PRODUCER_FIELD_TO_COLUMN)[ProducerField];

@Injectable()
export class PrismaProducerRepository implements ProducerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(entity: Producer) {
    const row = await this.prisma.producer.upsert({
      where: { id: entity.id },
      update: {
        ...this.toPersistence(entity),
        isActive: entity.isActive
      },
      create: {
        id: entity.id,
        ...this.toPersistence(entity),
        isActive: entity.isActive
      }
    });

    return this.toDomain(row);
  }

  async update(id: string, dataToUpdate: Partial<Producer>) {
    const row = await this.prisma.producer.update({
      where: { id },
      data: {
        ...this.toPersistence(dataToUpdate),
        ...(dataToUpdate.isActive !== undefined && { isActive: dataToUpdate.isActive })
      }
    });

    return this.toDomain(row);
  }

  async findById(id: string): Promise<Producer | null> {
    const row = await this.prisma.producer.findUnique({ where: { id } });
    if (!row) return null;
    return this.toDomain(row);
  }

  async findByIdOrFail(id: string): Promise<Producer> {
    const row = await this.prisma.producer.findUnique({ where: { id } });
    if (!row) throw new NotFoundException();
    return this.toDomain(row);
  }

  async findAll(): Promise<Producer[]> {
    const rows = await this.prisma.producer.findMany();
    return rows.map((r) => this.toDomain(r));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.producer.delete({
      where: { id }
    });
  }

  /**
   * Maps Producer scalars onto Prisma columns.
   *
   * @param source - Full aggregate or partial update payload.
   * @returns Prisma scalars. A full aggregate yields every field; a patch yields only defined fields.
   */
  private toPersistence(source: Producer): Record<ProducerColumn, string>;

  private toPersistence(
    source: Partial<Pick<Producer, ProducerField>>
  ): Partial<Record<ProducerColumn, string>>;

  private toPersistence(
    source: Partial<Pick<Producer, ProducerField>>
  ): Partial<Record<ProducerColumn, string>> {
    const data: Partial<Record<ProducerColumn, string>> = {};

    for (const [field, column] of Object.entries(PRODUCER_FIELD_TO_COLUMN) as [
      ProducerField,
      ProducerColumn
    ][]) {
      const value = source[field];
      if (value !== undefined) {
        data[column] = value;
      }
    }

    return data;
  }

  /**
   * Reconstructs a Producer aggregate from a Prisma row.
   *
   * @param row - Persisted Producer record.
   * @returns Domain Producer.
   */
  private toDomain(row: ProducerRow): Producer {
    return Producer.reconstitute(
      row.id,
      row.name,
      row.email,
      row.phone,
      row.tvaNumber,
      row.addressLine1,
      row.postalCode,
      row.city,
      row.addressLine2,
      row.isActive
    );
  }
}
