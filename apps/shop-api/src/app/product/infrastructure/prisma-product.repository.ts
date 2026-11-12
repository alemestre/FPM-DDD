import { ProductReferenceNotFoundError } from "../domain/errors/product-reference-not-found.error";
import { ProductRepository, type ProductWithProducer } from "../domain/product.repository";
import { PrismaService } from "../../../prisma/prisma.service";
import { Injectable, NotFoundException } from "@nestjs/common";
import {
  Prisma,
  type Product as ProductRow,
  type ProductUnit as ProductUnitRow,
  type MeasureUnit as MeasureUnitRow
} from "../../../generated/prisma/client";
import { Product } from "../domain/product.entity";
import type { ProductUnitValue } from "../domain/value-objects/product-unit.value-object";
import type { MeasureUnitValue } from "../domain/value-objects/measure.value-object";
import type { ProductContent, ProductContentProps } from "../domain/value-objects/product-content.value-object";

/**
 * Prisma error raised when a write points to a missing producer or category:
 * foreign key violation (P2003) on `producerId` or `categoryId`.
 */
const FOREIGN_KEY_VIOLATION = "P2003";

/**
 * Keeps the Prisma enum and the domain units in sync at compile time.
 */
const UNIT_TO_DOMAIN = {
  KG: "KG",
  BOTTE: "BOTTE",
  PIECE: "PIECE",
  DOUZAINE: "DOUZAINE",
  BOUTEILLE: "BOUTEILLE",
  LOT: "LOT"
} as const satisfies Record<ProductUnitRow, ProductUnitValue>;

const UNIT_TO_ROW = {
  KG: "KG",
  BOTTE: "BOTTE",
  PIECE: "PIECE",
  DOUZAINE: "DOUZAINE",
  BOUTEILLE: "BOUTEILLE",
  LOT: "LOT"
} as const satisfies Record<ProductUnitValue, ProductUnitRow>;

/**
 * Keeps the Prisma enum and the domain measure units in sync at compile time.
 */
const MEASURE_UNIT_TO_DOMAIN = {
  g: "g",
  kg: "kg",
  ml: "ml",
  l: "l"
} as const satisfies Record<MeasureUnitRow, MeasureUnitValue>;

const MEASURE_UNIT_TO_ROW = {
  g: "g",
  kg: "kg",
  ml: "ml",
  l: "l"
} as const satisfies Record<MeasureUnitValue, MeasureUnitRow>;

/**
 * Loads only the producer fields exposed with a product.
 */
const WITH_PRODUCER = { producer: { select: { id: true, name: true } } } as const;

type ProductWithProducerRow = Prisma.ProductGetPayload<{ include: typeof WITH_PRODUCER }>;

/**
 * Product fields accepted by {@link PrismaProductRepository.update}.
 */
type ProductPatch = Partial<
  Pick<Product, "name" | "price" | "vatRate" | "stock" | "minStock" | "producerId" | "categoryId" | "image" | "unit" | "content">
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

  async findManyWithProducer(categoryId?: string): Promise<ProductWithProducer[]> {
    const rows = await this.prisma.product.findMany({
      where: categoryId ? { categoryId } : {},
      include: WITH_PRODUCER
    });
    return rows.map((row) => this.toDomainWithProducer(row));
  }

  /**
   * @throws {NotFoundException} If the product does not exist.
   */
  async findByIdWithProducerOrFail(id: string): Promise<ProductWithProducer> {
    const row = await this.prisma.product.findUnique({ where: { id }, include: WITH_PRODUCER });
    if (!row) throw new NotFoundException(`Produit ${id} introuvable`);
    return this.toDomainWithProducer(row);
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
      categoryId: entity.categoryId,
      image: entity.image,
      unit: UNIT_TO_ROW[entity.unit],
      ...this.toContentColumns(entity.content)
    };
  }

  /**
   * Maps only the defined fields of a patch onto Prisma update data.
   */
  private toUpdateData(patch: ProductPatch): Prisma.ProductUncheckedUpdateInput {
    const { name, price, vatRate, stock, minStock, producerId, categoryId, image, unit, content } = patch;

    return {
      ...(name !== undefined && { name }),
      ...(price !== undefined && { price }),
      ...(vatRate !== undefined && { vatRate }),
      ...(stock !== undefined && { stock }),
      ...(minStock !== undefined && { minStock }),
      ...(producerId !== undefined && { producerId }),
      ...(categoryId !== undefined && { categoryId }),
      ...(image !== undefined && { image }),
      ...(unit !== undefined && { unit: UNIT_TO_ROW[unit] }),
      ...(content !== undefined && this.toContentColumns(content))
    };
  }

  /**
   * Flattens the content into its three columns; all `null` when there is no content.
   */
  private toContentColumns(content: ProductContent | null) {
    return {
      contentItemCount: content?.itemCount ?? null,
      contentAmount: content?.itemSize?.amount ?? null,
      contentUnit: content?.itemSize ? MEASURE_UNIT_TO_ROW[content.itemSize.unit] : null
    };
  }

  /**
   * Rebuilds the content from its columns. An amount without a unit (or the reverse)
   * is passed on as is, so the domain rejects it instead of hiding it.
   */
  private toContentProps(row: ProductRow): ProductContentProps | null {
    if (row.contentItemCount === null) return null;

    const hasSize = row.contentAmount !== null || row.contentUnit !== null;
    return {
      itemCount: row.contentItemCount,
      itemSize: hasSize
        ? {
            amount: row.contentAmount === null ? Number.NaN : row.contentAmount.toNumber(),
            unit: row.contentUnit === null ? "" : MEASURE_UNIT_TO_DOMAIN[row.contentUnit]
          }
        : null
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

  private toDomainWithProducer(row: ProductWithProducerRow): ProductWithProducer {
    return { product: this.toDomain(row), producer: { id: row.producer.id, name: row.producer.name } };
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
      row.categoryId,
      row.image,
      UNIT_TO_DOMAIN[row.unit],
      this.toContentProps(row)
    );
  }
}
