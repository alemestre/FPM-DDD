import { DomainValidationError } from '../../../shared/domain/errors/domain-validation.error';
import { ProductContent } from './product-content.value-object';

export const PRODUCT_UNITS = ['KG', 'BOTTE', 'PIECE', 'DOUZAINE', 'BOUTEILLE', 'LOT'] as const;

export type ProductUnitValue = (typeof PRODUCT_UNITS)[number];

/**
 * Unit given to a product when none is specified.
 */
export const DEFAULT_PRODUCT_UNIT: ProductUnitValue = 'KG';

const DOZEN = 12;

/**
 * Unit in which a product is sold, with the content rules it implies:
 * - KG: sold by weight, the price is per kilogram, so no content;
 * - BOTTE, PIECE: content is optional (e.g. an indicative weight);
 * - DOUZAINE: 12 items, filled in when no content is given;
 * - BOUTEILLE: required, a single item measured as a volume (75 cl);
 * - LOT: required (4 × 125 g, 1 × 500 g).
 */
export class ProductUnit {
    private constructor(public readonly value: ProductUnitValue) {}

    /**
     * @throws {DomainValidationError} If the value is not a known unit.
     */
    static create(value: string): ProductUnit {
        if (!ProductUnit.isValid(value)) {
            throw new DomainValidationError(
                `L'unité doit être l'une des valeurs suivantes : ${PRODUCT_UNITS.join(', ')}`,
            );
        }

        return new ProductUnit(value);
    }

    private static isValid(value: string): value is ProductUnitValue {
        return (PRODUCT_UNITS as readonly string[]).includes(value);
    }

    isSoldByWeight(): boolean {
        return this.value === 'KG';
    }

    requiresContent(): boolean {
        return this.value === 'BOUTEILLE' || this.value === 'LOT';
    }

    /**
     * Number of items imposed by the unit (12 for DOUZAINE), or `null` when it is free.
     */
    fixedItemCount(): number | null {
        return this.value === 'DOUZAINE' ? DOZEN : null;
    }

    /**
     * Checks a content against the rules of this unit and returns the content to keep:
     * for DOUZAINE, a missing content becomes 12 items.
     *
     * @throws {DomainValidationError} If the content breaks a rule of this unit.
     */
    resolveContent(content: ProductContent | null): ProductContent | null {
        if (this.isSoldByWeight()) {
            if (content !== null) {
                throw new DomainValidationError(
                    "Un produit vendu au kilo n'a pas de contenu : son prix est au kilo",
                );
            }
            return null;
        }

        const fixedItemCount = this.fixedItemCount();
        if (fixedItemCount !== null) {
            if (content === null)
                return ProductContent.create({ itemCount: fixedItemCount, itemSize: null });
            if (content.itemCount !== fixedItemCount) {
                throw new DomainValidationError(
                    `Un produit vendu en ${this.value} contient ${fixedItemCount} articles`,
                );
            }
            return content;
        }

        if (content === null) {
            if (this.requiresContent()) {
                throw new DomainValidationError(
                    `Un produit vendu en ${this.value} doit préciser son contenu`,
                );
            }
            return null;
        }

        if (
            this.value === 'BOUTEILLE' &&
            (content.itemCount !== 1 || !content.itemSize?.isVolume())
        ) {
            throw new DomainValidationError(
                'Une bouteille contient un seul article mesuré en ml ou en l',
            );
        }

        return content;
    }

    equals(other: ProductUnit): boolean {
        return this.value === other.value;
    }
}
