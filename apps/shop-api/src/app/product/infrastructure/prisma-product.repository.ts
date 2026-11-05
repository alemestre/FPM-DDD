import { ProductReferenceNotFoundError } from "../domain/errors/product-reference-not-found.error";
import { ProductRepository } from "../domain/product.repository";
import { PrismaService } from "../../../prisma/prisma.service";
import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "../../../generated/prisma/client";
import { Product } from "../domain/product.entity";

/**
 * Prisma errors raised when a write points to a missing producer or category:
 * - P2003: foreign key violation on `producerId`;
 * - P2025: a category to `connect` / `set` was not found.
 */
const MISSING_REFERENCE_ERROR_CODES = new Set(["P2003", "P2025"]);

/**
 * Relations loaded with every product so the whole aggregate can be rebuilt.
 */
const PRODUCT_INCLUDE = {
  categories: { select: { id: true } }
} as const satisfies Prisma.ProductInclude;

type ProductRow = Prisma.ProductGetPayload<{ include: typeof PRODUCT_INCLUDE }>;

/**
 * Product fields accepted by {@link PrismaProductRepository.update}.
 */
type ProductPatch = Partial<
  Pick<Product, "name" | "price" | "vatRate" | "stock" | "minStock" | "producerId" | "categoryIds">
>;

@Injectable()
export class PrismaProductRepository implements ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates or replaces the whole aggregate, including its category links.
   *
   * @throws {ProductReferenceNotFoundError} If the producer or a category does not exist.
   */
  async save(entity: Product): Promise<Product> {
    const categories = this.toCategoryRefs(entity.categoryIds);

    try {
      const row = await this.prisma.product.upsert({
        where: { id: entity.id },
        create: {
          id: entity.id,
          ...this.toScalars(entity),
          categories: { connect: categories }
        },
        update: {
          ...this.toScalars(entity),
          categories: { set: categories }
        },
        include: PRODUCT_INCLUDE
      });

      return this.toDomain(row);
    } catch (error) {
      throw this.translateWriteError(error);
    }
  }

  /**
   * The product is loaded first because Prisma reports a missing product and a
   * missing category with the same P2025 code.
   *
   * @throws {NotFoundException} If the product does not exist.
   * @throws {ProductReferenceNotFoundError} If the producer or a category does not exist.
   */
  async update(id: string, dataToUpdate: ProductPatch): Promise<Product> {
    await this.findByIdOrFail(id);

    try {
      const row = await this.prisma.product.update({
        where: { id },
        data: this.toUpdateData(dataToUpdate),
        include: PRODUCT_INCLUDE
      });

      return this.toDomain(row);
    } catch (error) {
      throw this.translateWriteError(error);
    }
  }

  async findById(id: string): Promise<Product | null> {
    const row = await this.prisma.product.findUnique({ where: { id }, include: PRODUCT_INCLUDE });
    return row ? this.toDomain(row) : null;
  }

  async findByIdOrFail(id: string): Promise<Product> {
    const product = await this.findById(id);
    if (!product) throw new NotFoundException(`Produit ${id} introuvable`);
    return product;
  }

  async findAll(): Promise<Product[]> {
    const rows = await this.prisma.product.findMany({ include: PRODUCT_INCLUDE });
    return rows.map((row) => this.toDomain(row));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.product.delete({ where: { id } });
  }

  private toScalars(entity: Product) {
    return {
      name: entity.name,
      price: entity.price,
      vatRate: entity.vatRate,
      stock: entity.stock,
      minStock: entity.minStock,
      producerId: entity.producerId
    };
  }

  /**
   * Maps only the defined fields of a patch onto Prisma update data.
   */
  private toUpdateData(patch: ProductPatch): Prisma.ProductUncheckedUpdateInput {
    const { name, price, vatRate, stock, minStock, producerId, categoryIds } = patch;

    return {
      ...(name !== undefined && { name }),
      ...(price !== undefined && { price }),
      ...(vatRate !== undefined && { vatRate }),
      ...(stock !== undefined && { stock }),
      ...(minStock !== undefined && { minStock }),
      ...(producerId !== undefined && { producerId }),
      ...(categoryIds !== undefined && { categories: { set: this.toCategoryRefs(categoryIds) } })
    };
  }

  /**
   * Turns a missing producer / category error into a domain error and keeps
   * the Prisma error as `cause`. Any other error is returned unchanged.
   */
  private translateWriteError(error: unknown): unknown {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      MISSING_REFERENCE_ERROR_CODES.has(error.code)
    ) {
      return new ProductReferenceNotFoundError({ cause: error });
    }

    return error;
  }

  private toCategoryRefs(categoryIds: readonly string[]) {
    return categoryIds.map((id) => ({ id }));
  }

  /**
   * Rebuilds the Product aggregate from a Prisma row, converting Decimal columns to numbers.
   */
  private toDomain(row: ProductRow): Product {
    return Product.reconstitute(
      row.id,
      row.name,
      row.price.toNumber(),
      row.vatRate.toNumber(),
      row.stock,
      row.minStock,
      row.producerId,
      row.categories.map((category) => category.id)
    );
  }
}
