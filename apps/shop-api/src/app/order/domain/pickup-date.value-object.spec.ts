import { PickupDate } from './pickup-date.value-object';

/** Noon in Paris (UTC+1 in November), so the Paris day is the one written. */
const parisNoon = (isoDay: string) => new Date(`${isoDay}T11:00:00Z`);
const day = (date: Date) => date.toISOString().slice(0, 10);

describe('PickupDate', () => {
    describe('estimateFrom', () => {
        it.each([
            ['lundi', '2026-11-16', '2026-11-19'], // + 2 = mercredi → jeudi
            ['mardi', '2026-11-17', '2026-11-19'], // + 2 = jeudi
            ['mercredi', '2026-11-18', '2026-11-20'], // + 2 = vendredi
            ['jeudi', '2026-11-19', '2026-11-21'], // + 2 = samedi
            ['vendredi', '2026-11-20', '2026-11-26'], // + 2 = dimanche → jeudi suivant
            ['samedi', '2026-11-21', '2026-11-26'], // + 2 = lundi → jeudi
            ['dimanche', '2026-11-22', '2026-11-26'], // + 2 = mardi → jeudi
        ])('commande passée un %s (%s) : disponible le %s', (_weekday, orderedOn, expected) => {
            expect(day(PickupDate.estimateFrom(parisNoon(orderedOn)).value)).toBe(expected);
        });

        it('passe au mois suivant', () => {
            expect(day(PickupDate.estimateFrom(parisNoon('2026-11-27')).value)).toBe('2026-12-03');
        });

        it("compte le jour de commande à l'heure de Paris", () => {
            // Mercredi 18/11 23h30 UTC = jeudi 19/11 00h30 à Paris : + 2 = samedi.
            expect(day(PickupDate.estimateFrom(new Date('2026-11-18T23:30:00Z')).value)).toBe('2026-11-21');
        });

        it('renvoie un jour calendaire à minuit UTC', () => {
            expect(PickupDate.estimateFrom(parisNoon('2026-11-16')).value.toISOString()).toBe(
                '2026-11-19T00:00:00.000Z',
            );
        });
    });

    it('restore reprend la date telle quelle, sans la recalculer', () => {
        const stored = new Date('2026-11-21T00:00:00Z');

        expect(PickupDate.restore(stored).value).toEqual(stored);
    });

    it("ne peut pas être modifiée depuis l'extérieur", () => {
        const pickupDate = PickupDate.estimateFrom(parisNoon('2026-11-16'));
        pickupDate.value.setUTCDate(1);

        expect(day(pickupDate.value)).toBe('2026-11-19');
    });

    it('compare par valeur', () => {
        const stored = new Date('2026-11-19T00:00:00Z');

        expect(PickupDate.estimateFrom(parisNoon('2026-11-16')).equals(PickupDate.restore(stored))).toBe(true);
        expect(PickupDate.estimateFrom(parisNoon('2026-11-17')).equals(PickupDate.restore(stored))).toBe(true);
        expect(PickupDate.estimateFrom(parisNoon('2026-11-18')).equals(PickupDate.restore(stored))).toBe(false);
    });
});
