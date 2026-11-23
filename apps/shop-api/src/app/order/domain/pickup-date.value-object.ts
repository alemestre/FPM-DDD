import { toParisCalendarDay } from '@fpm/tools';

/**
 * Indicative day from which an order can be picked up at the shop,
 * as a calendar day at 00:00 UTC.
 */
export class PickupDate {
    /** Days needed to prepare an order before it can be picked up. */
    static readonly PREPARATION_DAYS = 2;

    /** Days the shop is open, as `Date.getUTCDay()` values: Thursday, Friday, Saturday. */
    static readonly SHOP_OPENING_DAYS: readonly number[] = [4, 5, 6];

    private constructor(private readonly _value: Date) {}

    /**
     * The order day (Paris) plus {@link PickupDate.PREPARATION_DAYS}, moved to the first
     * opening day on or after it.
     * Monday → Wednesday → Thursday; Thursday → Saturday; Friday → Sunday → next Thursday.
     */
    static estimateFrom(orderedAt: Date): PickupDate {
        const day = toParisCalendarDay(orderedAt);
        day.setUTCDate(day.getUTCDate() + PickupDate.PREPARATION_DAYS);

        while (!PickupDate.SHOP_OPENING_DAYS.includes(day.getUTCDay())) {
            day.setUTCDate(day.getUTCDate() + 1);
        }

        return new PickupDate(day);
    }

    /** Rebuilds a pickup date read from the database, without estimating it again. */
    static restore(value: Date): PickupDate {
        return new PickupDate(new Date(value.getTime()));
    }

    /** A copy, so the value object stays immutable. */
    get value(): Date {
        return new Date(this._value.getTime());
    }

    equals(other: PickupDate): boolean {
        return this._value.getTime() === other._value.getTime();
    }
}
