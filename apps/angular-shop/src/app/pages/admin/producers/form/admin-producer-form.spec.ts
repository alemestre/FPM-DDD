import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { ADMIN_PRODUCERS_URL, FERME_DU_BOIS, producerPageProviders, settle } from '../testing';
import type { ConfirmDialogService } from '../../../../shared/confirm-dialog/confirm-dialog';
import type { ProducerRequestDto } from '@fpm/contracts';
import { AdminProducerForm } from './admin-producer-form';
import { omit } from 'lodash';

const createConfirmDialog = () => ({
    confirm: vi.fn<ConfirmDialogService['confirm']>(async () => true),
});
const createNotifications = () => ({ showSuccess: vi.fn(), showError: vi.fn() });

/** Champs texte du formulaire, par id de l'input. */
const TEXT_FIELDS = {
    name: 'producer-name',
    vatNumber: 'producer-vat-number',
    email: 'producer-email',
    phone: 'producer-phone',
    addressLine1: 'producer-address-line1',
    addressLine2: 'producer-address-line2',
    postalCode: 'producer-postal-code',
    city: 'producer-city',
} as const;
type TextField = keyof typeof TEXT_FIELDS;

const VALID_BODY: ProducerRequestDto = omit(FERME_DU_BOIS, 'id');

describe('AdminProducerForm', () => {
    let http: HttpTestingController;
    let harness: RouterTestingHarness;
    let notifications: ReturnType<typeof createNotifications>;

    beforeEach(async () => {
        notifications = createNotifications();
        TestBed.configureTestingModule({
            providers: [
                provideRouter([
                    { path: 'admin/producteurs/nouveau', component: AdminProducerForm },
                    { path: 'admin/producteurs/:id/modifier', component: AdminProducerForm },
                    { path: 'admin/producteurs/:id', children: [] },
                ]),
                ...producerPageProviders(createConfirmDialog(), notifications),
            ],
        });
        http = TestBed.inject(HttpTestingController);
        harness = await RouterTestingHarness.create();
    });

    afterEach(() => http.verify());

    const element = () => harness.fixture.nativeElement as HTMLElement;
    const input = (field: TextField) => {
        const found = element().querySelector<HTMLInputElement>(`#${TEXT_FIELDS[field]}`);
        if (!found) throw new Error(`champ ${field} absent`);
        return found;
    };
    const isActiveInput = () => element().querySelector<HTMLInputElement>('#producer-is-active');
    const fill = async (values: Partial<Record<TextField, string>>) => {
        for (const [field, value] of Object.entries(values) as [TextField, string][]) {
            const target = input(field);
            target.value = value;
            target.dispatchEvent(new Event('input'));
        }
        await settle();
    };
    const fillValid = () =>
    fill(Object.fromEntries((Object.keys(TEXT_FIELDS) as TextField[]).map((field) => [field, VALID_BODY[field]])));
    const submit = async () => {
        element().querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
        await settle();
    };
    const errorsOf = (field: TextField) =>
        input(field).closest('div')?.querySelector('.invalid-feedback')?.textContent ?? '';
    const currentUrl = () => TestBed.inject(Router).url;

    describe('ajout', () => {
        beforeEach(async () => {
            await harness.navigateByUrl('/admin/producteurs/nouveau');
        });

        it('part de champs vides, producteur actif par défaut', () => {
            expect(element().querySelector('h1')?.textContent).toContain('Nouveau producteur');
            for (const field of Object.keys(TEXT_FIELDS) as TextField[]) {
                expect(input(field).value).toBe('');
            }
            expect(isActiveInput()?.checked).toBe(true);
        });

        it('crée le producteur avec tous les champs puis ouvre sa fiche', async () => {
            await fillValid();
            await submit();

            const request = http.expectOne(ADMIN_PRODUCERS_URL);
            expect(request.request.method).toBe('POST');
            expect(request.request.body).toEqual(VALID_BODY);
            request.flush({ success: true, data: FERME_DU_BOIS });
            await settle();

            await vi.waitFor(() =>
                expect(currentUrl()).toBe(`/admin/producteurs/${FERME_DU_BOIS.id}`),
            );
            expect(notifications.showSuccess).toHaveBeenCalledWith('Producteur créé');
        });

        it('envoie isActive à false si la case est décochée', async () => {
            await fillValid();
            isActiveInput()?.click();
            await settle();
            await submit();

            const request = http.expectOne(ADMIN_PRODUCERS_URL);
            expect(request.request.body).toEqual({ ...VALID_BODY, isActive: false });
            request.flush({ success: true, data: { ...FERME_DU_BOIS, isActive: false } });
            await settle();
        });

        it("n'appelle pas l'API tant que les champs obligatoires sont vides", async () => {
            await submit();

            http.expectNone(ADMIN_PRODUCERS_URL);
            expect(errorsOf('name')).toContain('Le nom est obligatoire.');
            expect(errorsOf('vatNumber')).toContain('Le numéro de TVA est obligatoire.');
            expect(errorsOf('email')).toContain('L’e-mail est obligatoire.');
            expect(errorsOf('phone')).toContain('Le téléphone est obligatoire.');
            expect(errorsOf('addressLine1')).toContain('L’adresse est obligatoire.');
            expect(errorsOf('postalCode')).toContain('Le code postal est obligatoire.');
            expect(errorsOf('city')).toContain('La ville est obligatoire.');
        });

        it("refuse les formats invalides sans appeler l'API", async () => {
            await fillValid();
            await fill({
                name: 'ab',
                email: 'pas-un-email',
                phone: '12 34',
                vatNumber: 'BE0123456789',
                postalCode: '2920',
            });
            await submit();

            http.expectNone(ADMIN_PRODUCERS_URL);
            expect(errorsOf('name')).toContain('au moins 3 caractères');
            expect(errorsOf('email')).toContain('L’e-mail n’est pas valide.');
            expect(errorsOf('phone')).toContain('numéro français');
            expect(errorsOf('vatNumber')).toContain('FR + 11 chiffres');
            expect(errorsOf('postalCode')).toContain('5 chiffres');
        });

        it.each([
            ['phone', '+33 6 12 34 56 78'],
            ['phone', '06.12.34.56.78'],
            ['vatNumber', 'fr 40 303 265 045'],
            ['postalCode', '29 200'],
        ] as [TextField, string][])('accepte %s = « %s »', async (field, value) => {
            await fillValid();
            await fill({ [field]: value });
            await submit();

            const request = http.expectOne(ADMIN_PRODUCERS_URL);
            // Envoyé tel que saisi : les value objects de l'API normalisent le format.
            expect(request.request.body).toEqual({ ...VALID_BODY, [field]: value });
            request.flush({ success: true, data: FERME_DU_BOIS });
            await settle();
        });

        it("affiche le message de l'API sur un refus (clé de TVA fausse…)", async () => {
            await fillValid();
            await submit();

            http.expectOne(ADMIN_PRODUCERS_URL).flush(
                { message: 'Le numéro de TVA est invalide' },
                { status: 400, statusText: 'Bad Request' },
            );
            await settle();

            await vi.waitFor(() =>
                expect(element().querySelector('.alert-danger')?.textContent).toContain(
                    'Le numéro de TVA est invalide',
                ),
            );
            expect(currentUrl()).toBe('/admin/producteurs/nouveau');
        });
    });

    describe('modification', () => {
        const INACTIVE = { ...FERME_DU_BOIS, addressLine2: 'Lieu-dit Kerbras', isActive: false };

        beforeEach(async () => {
            await harness.navigateByUrl(`/admin/producteurs/${FERME_DU_BOIS.id}/modifier`);
            http.expectOne(`${ADMIN_PRODUCERS_URL}/${FERME_DU_BOIS.id}`).flush({
                success: true,
                data: INACTIVE,
            });
            await settle();
        });

        it('pré-remplit tous les champs', () => {
            expect(element().querySelector('h1')?.textContent).toContain('Modifier le producteur');
            for (const field of Object.keys(TEXT_FIELDS) as TextField[]) {
                expect(input(field).value).toBe(INACTIVE[field]);
            }
            expect(isActiveInput()?.checked).toBe(false);
        });

        it('enregistre avec PATCH puis ouvre la fiche', async () => {
            await fill({ city: 'Quimper', postalCode: '29000' });
            isActiveInput()?.click();
            await settle();
            await submit();

            const request = http.expectOne(`${ADMIN_PRODUCERS_URL}/${FERME_DU_BOIS.id}`);
            expect(request.request.method).toBe('PATCH');
            expect(request.request.body).toEqual({
                ...omit(INACTIVE, 'id'),
                city: 'Quimper',
                postalCode: '29000',
                isActive: true,
            });
            request.flush({
                success: true,
                data: { ...INACTIVE, city: 'Quimper', postalCode: '29000', isActive: true },
            });
            await settle();

            await vi.waitFor(() =>
                expect(currentUrl()).toBe(`/admin/producteurs/${FERME_DU_BOIS.id}`),
            );
            expect(notifications.showSuccess).toHaveBeenCalledWith('Producteur modifié');
        });
    });

    describe('producteur inexistant', () => {
        it('affiche « Producteur introuvable » sur un 404', async () => {
            await harness.navigateByUrl(`/admin/producteurs/${FERME_DU_BOIS.id}/modifier`);
            http.expectOne(`${ADMIN_PRODUCERS_URL}/${FERME_DU_BOIS.id}`).flush(
                { message: 'Not Found' },
                { status: 404, statusText: 'Not Found' },
            );
            await settle();

            expect(element().textContent).toContain('Producteur introuvable');
        });
    });
});
