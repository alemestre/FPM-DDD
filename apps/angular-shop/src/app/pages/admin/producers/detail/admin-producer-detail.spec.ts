import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { ADMIN_PRODUCERS_URL, FERME_DU_BOIS, producerPageProviders, settle } from '../testing';
import type { ConfirmDialogService } from '../../../../shared/confirm-dialog/confirm-dialog';
import type { ProducerResponseDto } from '@fpm/contracts';
import { AdminProducerDetail } from './admin-producer-detail';

const createConfirmDialog = () => ({
    confirm: vi.fn<ConfirmDialogService['confirm']>(async () => true),
});
const createNotifications = () => ({ showSuccess: vi.fn(), showError: vi.fn() });

describe('AdminProducerDetail', () => {
    let http: HttpTestingController;
    let harness: RouterTestingHarness;
    let notifications: ReturnType<typeof createNotifications>;

    beforeEach(async () => {
        notifications = createNotifications();
        TestBed.configureTestingModule({
            providers: [
                provideRouter([
                    { path: 'admin/producteurs', children: [] },
                    { path: 'admin/producteurs/:id', component: AdminProducerDetail },
                ]),
                ...producerPageProviders(createConfirmDialog(), notifications),
            ],
        });
        http = TestBed.inject(HttpTestingController);
        harness = await RouterTestingHarness.create();
    });

    afterEach(() => http.verify());

    const open = async (
        response: { status: 200; producer?: ProducerResponseDto } | { status: number } = {
            status: 200,
        },
    ) => {
        await harness.navigateByUrl(`/admin/producteurs/${FERME_DU_BOIS.id}`);
        const request = http.expectOne(`${ADMIN_PRODUCERS_URL}/${FERME_DU_BOIS.id}`);
        if (response.status === 200) {
            request.flush({
                success: true,
                data: ('producer' in response && response.producer) || FERME_DU_BOIS,
            });
        } else {
            request.flush({ message: 'Erreur' }, { status: response.status, statusText: 'Erreur' });
        }
        await settle();
        return harness.fixture.nativeElement as HTMLElement;
    };

    /** Contenu de la fiche, intitulé par intitulé. */
    const details = (element: HTMLElement) =>
        Object.fromEntries(
            [...element.querySelectorAll('dt')].map((term) => [
                term.textContent?.trim(),
                term.nextElementSibling?.textContent?.replace(/\s+/g, ' ').trim(),
            ]),
        );

    it('affiche tous les champs du producteur', async () => {
        const element = await open();

        expect(element.querySelector('h1')?.textContent).toContain('Ferme du Bois');
        expect(details(element)).toEqual({
            Nom: 'Ferme du Bois',
            'Numéro de TVA': 'FR40303265045',
            'E-mail': 'contact@fermedubois.fr',
            Téléphone: '06 12 34 56 78',
            Adresse: '12 chemin des Prés 29200 Brest',
            Statut: 'Actif',
        });
        expect(element.querySelector('a[href="mailto:contact@fermedubois.fr"]')).not.toBeNull();
        expect(element.querySelector('a[href="tel:06 12 34 56 78"]')).not.toBeNull();
    });

    it("affiche le complément d'adresse et le statut inactif", async () => {
        const element = await open({
            status: 200,
            producer: { ...FERME_DU_BOIS, addressLine2: 'Lieu-dit Kerbras', isActive: false },
        });

        expect(details(element)['Adresse']).toBe('12 chemin des Prés Lieu-dit Kerbras 29200 Brest');
        expect(details(element)['Statut']).toBe('Inactif');
    });

    it('affiche « Producteur introuvable » sur un 404', async () => {
        const element = await open({ status: 404 });

        expect(element.textContent).toContain('Producteur introuvable');
    });

    it('affiche une erreur de chargement sur un 500', async () => {
        const element = await open({ status: 500 });

        expect(element.querySelector('.alert-danger')?.textContent).toContain(
            'Le producteur n’a pas pu être chargé.',
        );
    });

    it("n'offre pas de suppression : le producteur garde la trace des produits et des commandes", async () => {
        const element = await open();

        expect(
            [...element.querySelectorAll('button')].some((button) => button.textContent?.includes('Supprimer')),
        ).toBe(false);
    });
});
