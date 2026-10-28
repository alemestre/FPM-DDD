import { Uuid } from "../../../core/domain/value-objects/uuid.value-object";

/**
 * Product aggregate root.
 *
 * A product belongs to a category and carries pricing, VAT, and stock
 * invariants that `create` and `update` enforce.
 */
export class Product {
    /**
     * Builds a product. Callers use {@link Product.create} instead of this
     * constructor so invariants are checked first.
     *
     * @param id - Product identity.
     * @param name - Display name.
     * @param price - Unit price excluding VAT. Must be greater than 0.
     * @param tvaRate - VAT rate as a percentage. Must be greater than 0.
     * @param stock - Current quantity. Must be at least `minStock`.
     * @param minStock - Minimum quantity to keep in stock.
     * @param categoryId - Identifier of the owning category.
     */
    private constructor(
        public readonly id: Uuid,
        public name: string,
        public price: number,
        public tvaRate: number,
        public stock: number,
        public minStock: number,
        public categoryId: Uuid,
    ) {}

    /**
     * Unit price including VAT.
     */
    get priceWithTva(): number {
        return this.price * (1 + this.tvaRate / 100);
    }

    /**
     * Creates a new product after validating pricing, VAT, stock, and category.
     *
     * @param name - Display name.
     * @param price - Unit price excluding VAT. Must be greater than 0.
     * @param tvaRate - VAT rate as a percentage. Must be greater than 0.
     * @param stock - Current quantity. Must be at least `minStock`.
     * @param minStock - Minimum quantity to keep in stock.
     * @param categoryId - Identifier of the owning category.
     * @returns A new product with a generated identity.
     * @throws Error when an invariant fails.
     */
    static create(
        name: string,
        price: number,
        tvaRate: number,
        stock: number,
        minStock: number,
        categoryId: Uuid,
    ): Product {
        Product.assertInvariants(name,price, tvaRate, stock, minStock, categoryId);
        return new Product(new Uuid(), name, price, tvaRate, stock, minStock, categoryId);
    }

    /**
     * Applies a full update after validating the same invariants as create.
     *
     * @param name - Display name.
     * @param price - Unit price excluding VAT. Must be greater than 0.
     * @param tvaRate - VAT rate as a percentage. Must be greater than 0.
     * @param stock - Current quantity. Must be at least `minStock`.
     * @param minStock - Minimum quantity to keep in stock.
     * @param categoryId - Identifier of the owning category.
     * @throws Error when an invariant fails.
     */
    update(
        name: string,
        price: number,
        tvaRate: number,
        stock: number,
        minStock: number,
        categoryId: Uuid,
    ): void {
        Product.assertInvariants(name, price, tvaRate, stock, minStock, categoryId);
        this.name = name;
        this.price = price;
        this.tvaRate = tvaRate;
        this.stock = stock;
        this.minStock = minStock;
        this.categoryId = categoryId;
    }

    /**
     * Ensures pricing, VAT, stock, and category satisfy product rules.
     *
     * @param price - Unit price excluding VAT.
     * @param tvaRate - VAT rate as a percentage.
     * @param stock - Current quantity.
     * @param minStock - Minimum quantity to keep in stock.
     * @param categoryId - Identifier of the owning category.
     * @throws Error when an invariant fails.
     */
    private static assertInvariants(
        name: string,
        price: number,
        tvaRate: number,
        stock: number,
        minStock: number,
        categoryId: Uuid,
    ): void {
        if (name.trim() === "") {
            throw new Error("Name must be provided");
        }
        if (price <= 0) {
            throw new Error("Price must be greater than 0");
        }
        if (tvaRate <= 0) {
            throw new Error("TVA rate must be greater than 0");
        }
        if (stock < minStock) {
            throw new Error("Stock must be greater than or equal to min stock");
        }
        Uuid.validate(categoryId.getValue());
    }
}
