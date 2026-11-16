import { Component, input, model } from '@angular/core';

/** Champ de recherche : expose la saisie, mise à jour à chaque frappe, via `[(query)]`. */
@Component({
    selector: 'app-search-bar',
    templateUrl: './search-bar.html',
})
export class SearchBar {
    readonly query = model('');

    readonly placeholder = input('Rechercher un produit…');

    protected onInput(value: string) {
        this.query.set(value);
    }
}
