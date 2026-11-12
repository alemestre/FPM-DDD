import { DomainValidationError } from '../../../shared/domain/errors/domain-validation.error';
import { Measure, type ReferenceUnitValue } from './measure.value-object';

/**
 * Primitive shape of a product content, as given by callers and persistence.
 */
export interface ProductContentProps {
    readonly itemCount: number;
    readonly itemSize: { readonly amount: number; readonly unit: string } | null;
}

/**
 * What one sale unit of a product contains: a number of items, each with an
 * optional size. Examples: 4 × 125 g (yogurts), 12 × — (eggs), 1 × 750 ml (bottle).
 */
export class ProductContent {
    private constructor(
        public readonly itemCount: number,
        public readonly itemSize: Measure | null,
    ) {}

    /**
     * @throws {DomainValidationError} If the item count is not an integer >= 1,
     *   or if a single item has no size (the content would then say nothing).
     */
    static create({ itemCount, itemSize }: ProductContentProps): ProductContent {
        if (!Number.isSafeInteger(itemCount) || itemCount < 1) {
            throw new DomainValidationError(
                "Le nombre d'articles doit être un entier supérieur ou égal à 1",
            );
        }
        if (itemCount === 1 && itemSize === null) {
            throw new DomainValidationError("Un contenu d'un seul article doit préciser sa mesure");
        }

        return new ProductContent(
            itemCount,
            itemSize === null ? null : Measure.create(itemSize.amount, itemSize.unit),
        );
    }

    static fromNullable(props: ProductContentProps | null): ProductContent | null {
        return props === null ? null : ProductContent.create(props);
    }

    /**
     * Total content in kilograms or litres (4 × 125 g → 0.5 kg), or `null` when the item size is unknown.
     */
    totalInReferenceUnit(): { amount: number; unit: ReferenceUnitValue } | null {
        if (this.itemSize === null) return null;

        const { amount, unit } = this.itemSize.toReferenceUnit();
        return { amount: amount * this.itemCount, unit };
    }

    equals(other: ProductContent): boolean {
        const sameSize =
            this.itemSize === null || other.itemSize === null
                ? this.itemSize === other.itemSize
                : this.itemSize.equals(other.itemSize);

        return this.itemCount === other.itemCount && sameSize;
    }
}
