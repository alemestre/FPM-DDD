import { ProductReferenceNotFoundError } from "../domain/errors/product-reference-not-found.error";
import { ProductRepository } from "../domain/product.repository";
import { PrismaService } from "../../../prisma/prisma.service";
import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, type Product as ProductRow } from "../../../generated/prisma/client";
import { Product } from "../domain/product.entity";

/**
 * Prisma error raised when a write points to a missing producer or category:
 * foreign key violation (P2003) on `producerId` or `categoryId`.
 */
const FOREIGN_KEY_VIOLATION = "P2003";

/**
 * Product fields accepted by {@link PrismaProductRepository.update}.
 */
type ProductPatch = Partial<
  Pick<Product, "name" | "price" | "vatRate" | "stock" | "minStock" | "producerId" | "categoryId">
>;

@Injectable()
export class PrismaProductRepository implements ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates or replaces the whole aggregate.
   *
   * @throws {ProductReferenceNotFoundError} If the producer or the category does not exist.
   */
  async save(entity: Product): Promise<Product> {
    try {
      const row = await this.prisma.product.upsert({
        where: { id: entity.id },
        create: { id: entity.id, ...this.toScalars(entity) },
        update: this.toScalars(entity)
      });

      return this.toDomain(row);
    } catch (error) {
      throw this.translateWriteError(error);
    }
  }

  /**
   * @throws {NotFoundException} If the product does not exist.
   * @throws {ProductReferenceNotFoundError} If the producer or the category does not exist.
   */
  async update(id: string, dataToUpdate: ProductPatch): Promise<Product> {
    await this.findByIdOrFail(id);

    try {
      const row = await this.prisma.product.update({
        where: { id },
        data: this.toUpdateData(dataToUpdate)
      });

      return this.toDomain(row);
    } catch (error) {
      throw this.translateWriteError(error);
    }
  }

  async findById(id: string): Promise<Product | null> {
    const row = await this.prisma.product.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByIdOrFail(id: string): Promise<Product> {
    const product = await this.findById(id);
    if (!product) throw new NotFoundException(`Produit ${id} introuvable`);
    return product;
  }

  async findAll(): Promise<Product[]> {
    const rows = await this.prisma.product.findMany();
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
      producerId: entity.producerId,
      categoryId: entity.categoryId
    };
  }

  /**
   * Maps only the defined fields of a patch onto Prisma update data.
   */
  private toUpdateData(patch: ProductPatch): Prisma.ProductUncheckedUpdateInput {
    const { name, price, vatRate, stock, minStock, producerId, categoryId } = patch;

    return {
      ...(name !== undefined && { name }),
      ...(price !== undefined && { price }),
      ...(vatRate !== undefined && { vatRate }),
      ...(stock !== undefined && { stock }),
      ...(minStock !== undefined && { minStock }),
      ...(producerId !== undefined && { producerId }),
      ...(categoryId !== undefined && { categoryId })
    };
  }

  /**
   * Turns a missing producer / category error into a domain error and keeps
   * the Prisma error as `cause`. Any other error is returned unchanged.
   */
  private translateWriteError(error: unknown): unknown {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === FOREIGN_KEY_VIOLATION
    ) {
      return new ProductReferenceNotFoundError({ cause: error });
    }

    return error;
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
      row.categoryId
    );
  }
}
