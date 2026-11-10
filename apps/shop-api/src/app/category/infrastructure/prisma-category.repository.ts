import { Prisma, type Category as CategoryRow } from "../../../generated/prisma/client";
import { CategorySlugAlreadyUsedError } from "../domain/errors/category-slug-already-used.error";
import { Slug } from "../../shared/domain/value-objects/slug.value-object";
import { CategoryInUseError } from "../domain/errors/category-in-use.error";
import { CategoryRepository } from "../domain/category.repository";
import { PrismaService } from "../../../prisma/prisma.service";
import { Injectable, NotFoundException } from "@nestjs/common";
import { Category } from "../domain/category.entity";

/**
 * Prisma error codes: unique constraint violation (P2002) and foreign key violation (P2003).
 */
const UNIQUE_CONSTRAINT_VIOLATION = "P2002";
const FOREIGN_KEY_VIOLATION = "P2003";

@Injectable()
export class PrismaCategoryRepository implements CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * @throws {CategorySlugAlreadyUsedError} If another category already uses the slug.
   */
  async save(entity: Category): Promise<Category> {
    try {
      const row = await this.prisma.category.upsert({
        where: { id: entity.id },
        update: { name: entity.name, slug: entity.slug, updatedAt: new Date() },
        create: { id: entity.id, name: entity.name, slug: entity.slug }
      });

      return this.toDomain(row);
    } catch (error) {
      throw this.translateWriteError(error);
    }
  }

  /**
   * Keeps the slug in sync with the name, as `Category.changeName` does.
   *
   * @throws {CategorySlugAlreadyUsedError} If another category already uses the slug.
   */
  async update(id: string, dataToUpdate: Partial<Pick<Category, "name">>): Promise<Category> {
    try {
      const row = await this.prisma.category.update({
        where: { id },
        data: {
          ...(dataToUpdate.name !== undefined && {
            name: dataToUpdate.name,
            slug: Slug.fromText(dataToUpdate.name).toString()
          }),
          updatedAt: new Date()
        }
      });

      return this.toDomain(row);
    } catch (error) {
      throw this.translateWriteError(error);
    }
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

  async findBySlug(slug: string): Promise<Category | null> {
    const row = await this.prisma.category.findUnique({ where: { slug } });
    return row ? this.toDomain(row) : null;
  }

  async findAll(): Promise<Category[]> {
    const rows = await this.prisma.category.findMany();
    return rows.map((row) => this.toDomain(row));
  }

  /**
   * Products reference their category with `onDelete: Restrict`, so the
   * foreign key violation (P2003) means the category is still in use.
   *
   * @throws {CategoryInUseError} If at least one product uses the category.
   */
  async delete(id: string): Promise<void> {
    try {
      await this.prisma.category.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === FOREIGN_KEY_VIOLATION) {
        throw new CategoryInUseError({ cause: error });
      }
      throw error;
    }
  }

  /**
   * The only unique column a write can collide on is `slug` (`id` is the upsert key).
   */
  private translateWriteError(error: unknown): unknown {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === UNIQUE_CONSTRAINT_VIOLATION) {
      return new CategorySlugAlreadyUsedError({ cause: error });
    }
    return error;
  }

  /**
   * Rebuilds the Category aggregate from a Prisma row, keeping its persisted id.
   */
  private toDomain(row: CategoryRow): Category {
    return Category.reconstitute(row.id, row.name, row.slug);
  }
}
