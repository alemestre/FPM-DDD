import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';

/** Rappel « retrait en magasin, paiement en magasin », avec la date de disponibilité indicative. */
@Component({
    selector: 'app-pickup-info',
    imports: [DatePipe],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="alert alert-info mb-0" role="note">
            <h2 class="h6 fw-semibold d-flex align-items-center gap-2">
                <i class="bi bi-shop" aria-hidden="true"></i>
                Retrait en magasin uniquement
            </h2>
            <p class="mb-2">
                La livraison n'est pas disponible. Votre commande est à retirer au magasin le jeudi,
                le vendredi ou le samedi, aux horaires d'ouverture, dès réception de l'e-mail vous
                informant qu'elle vous attend.
            </p>
            <p class="mb-2">
                Disponibilité estimée :
                <!-- Jour calendaire stocké à minuit UTC : affiché en UTC pour garder ce jour. -->
                <strong>{{ pickupDate() | date: 'fullDate' : 'UTC' }}</strong>
                <span class="text-body-secondary"> (à titre indicatif)</span>
            </p>
            <p class="mb-0 d-flex align-items-center gap-2">
                <i class="bi bi-cash-coin" aria-hidden="true"></i>
                <strong>Paiement en magasin lors du retrait.</strong>
            </p>
        </div>
    `,
})
export class PickupInfo {
    /** Jour calendaire à 00:00 UTC. */
    readonly pickupDate = input.required<Date>();
}
