import { NotFoundException } from '@nestjs/common';
import { CategoryRepository } from '../domain/category.repository';
import type { Category } from '../domain/category.entity';
import { CategoryInUseError } from '../domain/errors/category-in-use.error';
import { CategorySlugAlreadyUsedError } from '../domain/errors/category-slug-already-used.error';

/** In-memory CategoryRepository for the HTTP specs: same conflicts as the Prisma adapter. */
export class InMemoryCategoryRepository extends CategoryRepository {
  readonly categories = new Map<string, Category>();
  /** Ids of categories that products still use: deleting them raises CategoryInUseError. */
  readonly usedByProducts = new Set<string>();

  async save(category: Category): Promise<Category> {
    const taken = [...this.categories.values()].some((c) => c.slug === category.slug && c.id !== category.id);
    if (taken) throw new CategorySlugAlreadyUsedError();
    this.categories.set(category.id, category);
    return category;
  }

  async findById(id: string): Promise<Category | null> {
    return this.categories.get(id) ?? null;
  }

  async findByIdOrFail(id: string): Promise<Category> {
    const category = this.categories.get(id);
    if (!category) throw new NotFoundException();
    return category;
  }

  async findBySlug(slug: string): Promise<Category | null> {
    return [...this.categories.values()].find((category) => category.slug === slug) ?? null;
  }

  async findAll(): Promise<Category[]> {
    return [...this.categories.values()];
  }

  async update(): Promise<Category> {
    throw new Error('not used by the category use cases');
  }

  async delete(id: string): Promise<void> {
    if (this.usedByProducts.has(id)) throw new CategoryInUseError();
    this.categories.delete(id);
  }
}
