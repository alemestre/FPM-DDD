import { toParisCalendarDay } from '@fpm/tools';

/**
 * Date de retrait indicative, même règle que l'API (`order/domain/pickup-date.ts`) :
 * jour de commande (heure de Paris) + 2 jours, puis premier jour d'ouverture
 * (jeudi, vendredi, samedi) à partir de cette date.
 * L'API reste la référence : la page de confirmation affiche la date qu'elle renvoie.
 */
export const PREPARATION_DAYS = 2;

/** Jours d'ouverture du magasin, valeurs de `getUTCDay()` : jeudi, vendredi, samedi. */
export const SHOP_OPENING_DAYS: readonly number[] = [4, 5, 6];

/** @returns Le jour calendaire, à 00:00 UTC (à afficher avec le fuseau `UTC`). */
export function estimatePickupDate(orderedAt: Date): Date {
    const pickup = toParisCalendarDay(orderedAt);
    pickup.setUTCDate(pickup.getUTCDate() + PREPARATION_DAYS);

    while (!SHOP_OPENING_DAYS.includes(pickup.getUTCDay())) {
        pickup.setUTCDate(pickup.getUTCDate() + 1);
    }

    return pickup;
}
