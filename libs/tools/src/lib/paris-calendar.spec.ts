import { PARIS_DATE_FORMAT, toParisCalendarDay } from './paris-calendar';

describe('toParisCalendarDay', () => {
    it('returns the same calendar day at 00:00 UTC during the day', () => {
        expect(toParisCalendarDay(new Date('2026-11-20T14:00:00Z')).toISOString()).toBe(
            '2026-11-20T00:00:00.000Z',
        );
    });

    it('moves to the next day when it is already past midnight in Paris (winter time)', () => {
        expect(toParisCalendarDay(new Date('2026-11-01T23:30:00Z')).toISOString()).toBe(
            '2026-11-02T00:00:00.000Z',
        );
    });

    it('moves to the next day when it is already past midnight in Paris (summer time)', () => {
        expect(toParisCalendarDay(new Date('2026-06-30T22:30:00Z')).toISOString()).toBe(
            '2026-07-01T00:00:00.000Z',
        );
    });

    it('stays on the same day just before midnight in Paris', () => {
        expect(toParisCalendarDay(new Date('2026-06-30T21:59:00Z')).toISOString()).toBe(
            '2026-06-30T00:00:00.000Z',
        );
    });
});

describe('PARIS_DATE_FORMAT', () => {
    it('formats an instant as YYYY-MM-DD in Paris time', () => {
        expect(PARIS_DATE_FORMAT.format(new Date('2026-10-31T23:30:00Z'))).toBe('2026-11-01');
    });
});
