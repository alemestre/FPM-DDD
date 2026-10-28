import { CategoryRepository } from "../domain/producer.repository";
import { PrismaService } from "../../../prisma/prisma.service";
import { Injectable, NotFoundException } from "@nestjs/common";
import { Category } from "../domain/producer.entity";

@Injectable()
export class PrismaCategoryRepository implements CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(entity: Category) {
    const row = await this.prisma.category.upsert({
      where: { id: entity.id },
      update: { label: entity.label, updatedAt: new Date() },
      create: { id: entity.id, label: entity.label }
    });

    const category = Category.create(row.label);
    return category;
  }

  async update(id: string, dataToUpdate: Partial<Category>) {
    const row = await this.prisma.category.update({
      where: { id },
      data: { ...dataToUpdate }
    });

    const category = Category.reconstitute(row.id, row.label);
    return category;
  }

  async findById(id: string): Promise<Category | null> {
    const row = await this.prisma.category.findUnique({ where: { id } });
    if (!row) return null;
    const category = Category.reconstitute(row.id, row.label);
    return category;
  }

  async findByIdOrFail(id: string): Promise<Category> {
    const row = await this.prisma.category.findUnique({ where: { id } });
    if (!row) throw new NotFoundException();
    const category = Category.reconstitute(row.id, row.label);
    return category;
  }

  async findAll(): Promise<Category[]> {
    const rows = await this.prisma.category.findMany();
    return rows.map((r) => {
      const category = Category.reconstitute(r.id, r.label);
      return category;
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.category.delete({
      where: { id }
    });
  }
}
