/**
 * Single rounding rule for amounts, the same as the storefront (`shared/money.ts`):
 * - the VAT of each line is rounded to the cent;
 * - a line total including VAT = line subtotal + line VAT;
 * - every total is the sum of the lines.
 * The lines shown therefore always add up to the total.
 */

/**
 * Rounds to the nearest cent (half up). `toPrecision` first removes the floating point error:
 * 0.275 × 100 is 27.499999… in JavaScript and would give 0.27 instead of 0.28.
 */
export function roundToCents(amount: number): number {
    return Math.round(Number((amount * 100).toPrecision(12))) / 100;
}

/** Sum of amounts already rounded to the cent, without floating point drift. */
export function sumCents(amounts: readonly number[]): number {
    return roundToCents(amounts.reduce((sum, amount) => sum + amount, 0));
}
