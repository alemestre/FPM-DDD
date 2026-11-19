import { email, pattern, required, schema } from '@angular/forms/signals';
import { POSTAL_CODE_PATTERN } from '../../../../validators/postal-code';
import { PHONE_PATTERN } from '../../../../validators/phone';

/** Adresse de facturation saisie au checkout. */
export interface AddressModel {
    line1: string;
    line2: string;
    postalCode: string;
    city: string;
}

/** Coordonnées de l'invité. Celles du client connecté viennent de son compte, côté API. */
export interface ContactModel {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
}

export const EMPTY_ADDRESS: AddressModel = { line1: '', line2: '', postalCode: '', city: '' };
export const EMPTY_CONTACT: ContactModel = { firstName: '', lastName: '', email: '', phone: '' };

/** Affichage d'un champ texte du formulaire (voir `app-billing-field`). */
export interface BillingFieldConfig<TKey extends string = string> {
    readonly key: TKey;
    readonly label: string;
    readonly type: 'text' | 'email' | 'tel';
    readonly autocomplete: string;
    readonly columnClass: string;
    readonly placeholder?: string;
}

export const CONTACT_FIELDS: readonly BillingFieldConfig<keyof ContactModel>[] = [
    {
        key: 'firstName',
        label: 'Prénom',
        type: 'text',
        autocomplete: 'given-name',
        columnClass: 'col-sm-6',
    },
    {
        key: 'lastName',
        label: 'Nom',
        type: 'text',
        autocomplete: 'family-name',
        columnClass: 'col-sm-6',
    },
    {
        key: 'email',
        label: 'Adresse e-mail',
        type: 'email',
        autocomplete: 'email',
        columnClass: 'col-sm-6',
        placeholder: 'vous@exemple.fr',
    },
    {
        key: 'phone',
        label: 'Téléphone',
        type: 'tel',
        autocomplete: 'tel',
        columnClass: 'col-sm-6',
        placeholder: '06 12 34 56 78',
    },
];

export const ADDRESS_FIELDS: readonly BillingFieldConfig<keyof AddressModel>[] = [
    {
        key: 'line1',
        label: 'Adresse',
        type: 'text',
        autocomplete: 'address-line1',
        columnClass: 'col-12',
        placeholder: '12 rue des Lilas',
    },
    {
        key: 'line2',
        label: "Complément d'adresse",
        type: 'text',
        autocomplete: 'address-line2',
        columnClass: 'col-12',
        placeholder: 'Bâtiment, étage…',
    },
    {
        key: 'postalCode',
        label: 'Code postal',
        type: 'text',
        autocomplete: 'postal-code',
        columnClass: 'col-sm-4',
    },
    {
        key: 'city',
        label: 'Ville',
        type: 'text',
        autocomplete: 'address-level2',
        columnClass: 'col-sm-8',
    },
];

export const addressSchema = schema<AddressModel>((path) => {
    required(path.line1, { message: "L'adresse est obligatoire." });
    required(path.postalCode, { message: 'Le code postal est obligatoire.' });
    pattern(path.postalCode, POSTAL_CODE_PATTERN, {
        message: 'Le code postal doit contenir 5 chiffres.',
    });
    required(path.city, { message: 'La ville est obligatoire.' });
});

export const contactSchema = schema<ContactModel>((path) => {
    required(path.firstName, { message: 'Le prénom est obligatoire.' });
    required(path.lastName, { message: 'Le nom est obligatoire.' });
    required(path.email, { message: "L'adresse e-mail est obligatoire." });
    email(path.email, { message: "L'adresse e-mail n'est pas valide." });
    required(path.phone, { message: 'Le numéro de téléphone est obligatoire.' });
    pattern(path.phone, PHONE_PATTERN, { message: "Le numéro de téléphone n'est pas valide." });
});
