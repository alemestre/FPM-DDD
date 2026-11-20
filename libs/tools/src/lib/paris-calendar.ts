/** Time zone of the shop: order numbers and pickup dates follow its calendar. */
export const SHOP_TIME_ZONE = 'Europe/Paris';

export const PARIS_DATE_FORMAT = new Intl.DateTimeFormat('en-CA', {
    timeZone: SHOP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
});

/**
 * Calendar day of `instant` at the shop, as a Date at 00:00 UTC
 * (the shape of a `@db.Date` column). 31/10 23:30 UTC is already 01/11 in Paris.
 */
export function toParisCalendarDay(instant: Date): Date {
    const [year, month, day] = PARIS_DATE_FORMAT.format(instant).split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
}
