import { toParisCalendarDay } from './paris-calendar';

/** Days needed to prepare an order before it can be picked up. */
export const PREPARATION_DAYS = 2;

/** Days the shop is open, as `Date.getUTCDay()` values: Thursday, Friday, Saturday. */
export const SHOP_OPENING_DAYS: readonly number[] = [4, 5, 6];

/**
 * Indicative pickup date: the order day (Paris) plus {@link PREPARATION_DAYS},
 * moved to the first opening day on or after it.
 * Monday → Wednesday → Thursday; Thursday → Saturday; Friday → Sunday → next Thursday.
 *
 * @returns The calendar day at 00:00 UTC.
 */
export function estimatePickupDate(orderedAt: Date): Date {
    const day = toParisCalendarDay(orderedAt);
    day.setUTCDate(day.getUTCDate() + PREPARATION_DAYS);

    while (!SHOP_OPENING_DAYS.includes(day.getUTCDay())) {
        day.setUTCDate(day.getUTCDate() + 1);
    }

    return day;
}
