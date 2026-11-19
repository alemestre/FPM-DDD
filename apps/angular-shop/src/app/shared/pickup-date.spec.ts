import { estimatePickupDate } from './pickup-date';

/** Midi à Paris (UTC+1 en novembre). */
const parisNoon = (isoDay: string) => new Date(`${isoDay}T11:00:00Z`);
const day = (date: Date) => date.toISOString().slice(0, 10);

describe('estimatePickupDate', () => {
    it.each([
        ['lundi', '2026-11-16', '2026-11-19'],
        ['mardi', '2026-11-17', '2026-11-19'],
        ['mercredi', '2026-11-18', '2026-11-20'],
        ['jeudi', '2026-11-19', '2026-11-21'],
        ['vendredi', '2026-11-20', '2026-11-26'],
        ['samedi', '2026-11-21', '2026-11-26'],
        ['dimanche', '2026-11-22', '2026-11-26'],
    ])('commande passée un %s (%s) : disponible le %s', (_weekday, orderedOn, expected) => {
        expect(day(estimatePickupDate(parisNoon(orderedOn)))).toBe(expected);
    });

    it('passe au mois suivant', () => {
        expect(day(estimatePickupDate(parisNoon('2026-11-27')))).toBe('2026-12-03');
    });

    it("compte le jour de commande à l'heure de Paris", () => {
        expect(day(estimatePickupDate(new Date('2026-11-18T23:30:00Z')))).toBe('2026-11-21');
    });
});
