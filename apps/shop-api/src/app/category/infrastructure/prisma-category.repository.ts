import type { Category as CategoryRow } from "../../../generated/prisma/client";
import { CategoryRepository } from "../domain/category.repository";
import { PrismaService } from "../../../prisma/prisma.service";
import { Injectable, NotFoundException } from "@nestjs/common";
import { Category } from "../domain/category.entity";

@Injectable()
export class PrismaCategoryRepository implements CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(entity: Category): Promise<Category> {
    const row = await this.prisma.category.upsert({
      where: { id: entity.id },
      update: { name: entity.name, updatedAt: new Date() },
      create: { id: entity.id, name: entity.name }
    });

    return this.toDomain(row);
  }

  async update(id: string, dataToUpdate: Partial<Pick<Category, "name">>): Promise<Category> {
    const row = await this.prisma.category.update({
      where: { id },
      data: {
        ...(dataToUpdate.name !== undefined && { name: dataToUpdate.name }),
        updatedAt: new Date()
      }
    });

    return this.toDomain(row);
  }

  async findById(id: string): Promise<Category | null> {
    const row = await this.prisma.category.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByIdOrFail(id: string): Promise<Category> {
    const category = await this.findById(id);
    if (!category) throw new NotFoundException(`Catégorie ${id} introuvable`);
    return category;
  }

  async findAll(): Promise<Category[]> {
    const rows = await this.prisma.category.findMany();
    return rows.map((row) => this.toDomain(row));
  }

  /**
   * Links with products are removed by Prisma (implicit many-to-many).
   */
  async delete(id: string): Promise<void> {
    await this.prisma.category.delete({ where: { id } });
  }

  /**
   * Rebuilds the Category aggregate from a Prisma row, keeping its persisted id.
   */
  private toDomain(row: CategoryRow): Category {
    return Category.reconstitute(row.id, row.name);
  }
}
