/**
 * Règle d'arrondi unique des montants, la même que l'API (`order/domain/money.ts`) :
 * - la TVA de chaque ligne est arrondie au centime ;
 * - le TTC d'une ligne = HT de la ligne + TVA de la ligne ;
 * - chaque total est la somme des lignes.
 * Ainsi la somme des lignes affichées est toujours égale au total.
 */

/**
 * Arrondit au centime le plus proche (moitié vers le haut). `toPrecision` corrige d'abord l'erreur
 * des nombres à virgule : 0,275 × 100 vaut 27,499999… en JavaScript et donnerait 0,27 au lieu de 0,28.
 */
export function roundToCents(amount: number): number {
    return Math.round(Number((amount * 100).toPrecision(12))) / 100;
}

export interface LineAmounts {
    /** HT de la ligne. */
    readonly subtotal: number;
    /** TVA de la ligne. */
    readonly tax: number;
    /** TTC de la ligne. */
    readonly total: number;
}

/** Montants d'une ligne à partir du prix unitaire HT, du taux de TVA (en %) et de la quantité. */
export function lineAmounts(unitPrice: number, vatRate: number, quantity: number): LineAmounts {
    const subtotal = roundToCents(unitPrice * quantity);
    const tax = roundToCents((subtotal * vatRate) / 100);
    return { subtotal, tax, total: roundToCents(subtotal + tax) };
}

/** Somme de montants déjà arrondis, sans dérive des nombres à virgule. */
export function sumCents(amounts: readonly number[]): number {
    return roundToCents(amounts.reduce((sum, amount) => sum + amount, 0));
}
