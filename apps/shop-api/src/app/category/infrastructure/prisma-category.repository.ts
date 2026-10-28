import { CategoryRepository } from "../application/port/category.repository";
import { PrismaService } from "../../../prisma/prisma.service";
import { Label } from "../domain/value-objects/label";
import { Category } from "../domain/category.entity";
import { Injectable } from "@nestjs/common";

@Injectable()
export class PrismaCategoryRepository implements CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(entity: Category) {
    const row = await this.prisma.category.upsert({
      where: { id: entity.id },
      update: { label: entity.label, updatedAt: new Date() },
      create: { id: entity.id, label: entity.label }
    });

    const category = new Category(row.id, Label.create(row.label));
    return category;
  }

  async update(id: string, dataToUpdate: Partial<Category>) {
    const row = await this.prisma.category.update({
      where: { id },
      data: { ...dataToUpdate }
    });

    const category = new Category(row.id, Label.create(row.label));
    return category;
  }

  async findById(id: string): Promise<Category | null> {
    const row = await this.prisma.category.findUnique({ where: { id } });
    if (!row) return null;
    const category = new Category(row.id, Label.create(row.label));
    return category;
  }

  async findAll(): Promise<Category[]> {
    const rows = await this.prisma.category.findMany();
    return rows.map((r) => {
      const category = new Category(r.id, Label.create(r.label));
      return category;
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.category.delete({
      where: { id }
    });
  }
}
