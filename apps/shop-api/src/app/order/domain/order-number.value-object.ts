import { DomainValidationError } from '../../shared/domain/errors/domain-validation.error';
import { toParisCalendarDay } from './paris-calendar';

const PERIOD_FORMAT = /^\d{4}-(0[1-9]|1[0-2])$/;
const NUMBER_FORMAT = /^(\d{4}-(?:0[1-9]|1[0-2]))-([1-9]\d*)$/;

/**
 * Order number `YYYY-MM-N`: N counts the orders of the month and restarts at 1
 * every month (Paris calendar), e.g. 2026-11-1, 2026-11-2, then 2026-12-1.
 */
export class OrderNumber {
    private constructor(
        readonly period: string,
        readonly sequence: number,
    ) {}

    /**
     * @param period - Month of the order, `YYYY-MM`.
     * @param sequence - Rank of the order in that month, from 1.
     */
    static of(period: string, sequence: number): OrderNumber {
        if (!PERIOD_FORMAT.test(period)) {
            throw new DomainValidationError(`La période "${period}" doit être au format AAAA-MM`);
        }
        if (!Number.isInteger(sequence) || sequence < 1) {
            throw new DomainValidationError(
                'Le rang de la commande dans le mois doit être un entier supérieur ou égal à 1',
            );
        }
        return new OrderNumber(period, sequence);
    }

    /** Reads a stored number such as `2026-11-7`. */
    static parse(raw: string): OrderNumber {
        const match = NUMBER_FORMAT.exec(raw);
        if (!match) {
            throw new DomainValidationError(`Le numéro de commande "${raw}" n'est pas valide`);
        }
        return OrderNumber.of(match[1], Number(match[2]));
    }

    /** Month (`YYYY-MM`, Paris calendar) whose sequence numbers an order placed at `instant`. */
    static periodOf(instant: Date): string {
        return toParisCalendarDay(instant).toISOString().slice(0, 7);
    }

    equals(other: OrderNumber): boolean {
        return this.period === other.period && this.sequence === other.sequence;
    }

    toString(): string {
        return `${this.period}-${this.sequence}`;
    }
}
