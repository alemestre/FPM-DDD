import { DomainValidationError } from '../../../shared/domain/errors/domain-validation.error';

export const MEASURE_UNITS = ['g', 'kg', 'ml', 'l'] as const;

export type MeasureUnitValue = (typeof MEASURE_UNITS)[number];

/**
 * Unit used for unit prices: per kilogram for weights, per litre for volumes.
 */
export type ReferenceUnitValue = 'kg' | 'l';

const REFERENCE_CONVERSION: Record<MeasureUnitValue, { unit: ReferenceUnitValue; factor: number }> =
    {
        g: { unit: 'kg', factor: 0.001 },
        kg: { unit: 'kg', factor: 1 },
        ml: { unit: 'l', factor: 0.001 },
        l: { unit: 'l', factor: 1 },
    };

/**
 * A weight or a volume: 125 g, 75 cl (750 ml), 1 l.
 */
export class Measure {
    private constructor(
        public readonly amount: number,
        public readonly unit: MeasureUnitValue,
    ) {}

    /**
     * @throws {DomainValidationError} If the amount is not strictly positive or the unit is unknown.
     */
    static create(amount: number, unit: string): Measure {
        if (!Number.isFinite(amount) || amount <= 0) {
            throw new DomainValidationError('La mesure doit être strictement supérieure à 0');
        }
        if (!Measure.isValidUnit(unit)) {
            throw new DomainValidationError(
                `L'unité de mesure doit être l'une des valeurs suivantes : ${MEASURE_UNITS.join(', ')}`,
            );
        }

        return new Measure(amount, unit);
    }

    private static isValidUnit(unit: string): unit is MeasureUnitValue {
        return (MEASURE_UNITS as readonly string[]).includes(unit);
    }

    isVolume(): boolean {
        return REFERENCE_CONVERSION[this.unit].unit === 'l';
    }

    /**
     * The same measure in kilograms or litres (e.g. 125 g → 0.125 kg).
     */
    toReferenceUnit(): { amount: number; unit: ReferenceUnitValue } {
        const { unit, factor } = REFERENCE_CONVERSION[this.unit];
        return { amount: this.amount * factor, unit };
    }

    equals(other: Measure): boolean {
        return this.amount === other.amount && this.unit === other.unit;
    }
}
