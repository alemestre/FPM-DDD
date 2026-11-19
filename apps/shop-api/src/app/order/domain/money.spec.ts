import { roundToCents, sumCents } from './money';

describe('roundToCents', () => {
    it.each([
        [0.275, 0.28], // 0,275 × 100 = 27,4999… en virgule flottante
        [1.005, 1.01],
        [5.274, 5.27],
        [0.798, 0.8],
        [2, 2],
    ])('arrondit %d à %d (moitié vers le haut)', (amount, expected) => {
        expect(roundToCents(amount)).toBe(expected);
    });
});

describe('sumCents', () => {
    it('additionne sans dérive des nombres à virgule', () => {
        expect(sumCents([0.1, 0.2])).toBe(0.3);
        expect(sumCents([])).toBe(0);
    });
});
