import { lineAmounts, roundToCents, sumCents } from './money';

describe('roundToCents', () => {
    it.each([
        [0.275, 0.28],
        [1.005, 1.01],
        [5.274, 5.27],
        [0.798, 0.8],
    ])('arrondit %d à %d (moitié vers le haut)', (amount, expected) => {
        expect(roundToCents(amount)).toBe(expected);
    });
});

describe('lineAmounts', () => {
    it('arrondit la TVA de la ligne puis calcule le TTC comme HT + TVA', () => {
        // 2 × 2,50 € à 5,5 % : TVA 0,275 → 0,28 ; TTC 5,28 (et non 5,27)
        expect(lineAmounts(2.5, 5.5, 2)).toEqual({ subtotal: 5, tax: 0.28, total: 5.28 });
    });
});

describe('sumCents', () => {
    it('additionne sans dérive des nombres à virgule', () => {
        expect(sumCents([0.1, 0.2])).toBe(0.3);
    });
});
