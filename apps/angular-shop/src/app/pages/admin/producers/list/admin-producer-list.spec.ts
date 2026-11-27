import { HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ADMIN_PRODUCERS_URL, FERME_DU_BOIS, producerPageProviders, settle } from '../testing';
import type { ConfirmDialogService } from '../../../../shared/confirm-dialog/confirm-dialog';
import { AdminProducerList } from './admin-producer-list';

const VERGER_DES_ILES = {
    ...FERME_DU_BOIS,
    id: '5d1c3a2b-7e4f-4a6b-9c8d-0e1f2a3b4c5d',
    name: 'Verger des Îles',
    email: 'bonjour@vergerdesiles.fr',
    isActive: false,
};

const createConfirmDialog = () => ({
    confirm: vi.fn<ConfirmDialogService['confirm']>(async () => true),
});
const createNotifications = () => ({ showSuccess: vi.fn(), showError: vi.fn() });

describe('AdminProducerList', () => {
    let fixture: ComponentFixture<AdminProducerList>;
    let http: HttpTestingController;
    let confirmDialog: ReturnType<typeof createConfirmDialog>;
    let notifications: ReturnType<typeof createNotifications>;

    beforeEach(async () => {
        confirmDialog = createConfirmDialog();
        notifications = createNotifications();
        TestBed.configureTestingModule({
            imports: [AdminProducerList],
            providers: [provideRouter([]), ...producerPageProviders(confirmDialog, notifications)],
        });
        http = TestBed.inject(HttpTestingController);
        fixture = TestBed.createComponent(AdminProducerList);
        TestBed.tick();
        http.expectOne(ADMIN_PRODUCERS_URL).flush({
            success: true,
            data: [FERME_DU_BOIS, VERGER_DES_ILES],
        });
        await settle();
    });

    afterEach(() => http.verify());

    const element = () => fixture.nativeElement as HTMLElement;
    const cells = () =>
        [...element().querySelectorAll('tbody tr')].map((row) =>
            [...row.querySelectorAll('td')].slice(0, 3).map((cell) => cell.textContent?.trim()),
        );

    it('affiche le nom, l’e-mail et le statut de chaque producteur', () => {
        expect(cells()).toEqual([
            ['Ferme du Bois', 'contact@fermedubois.fr', 'Actif'],
            ['Verger des Îles', 'bonjour@vergerdesiles.fr', 'Inactif'],
        ]);
        expect(element().querySelector('a[href="mailto:contact@fermedubois.fr"]')).not.toBeNull();
    });

    it('donne les liens vers la fiche et la modification', () => {
        expect(
            element().querySelector('a[aria-label="Voir Ferme du Bois"]')?.getAttribute('href'),
        ).toBe(`/${FERME_DU_BOIS.id}`);
        expect(
            element().querySelector('a[aria-label="Modifier Ferme du Bois"]')?.getAttribute('href'),
        ).toBe(`/${FERME_DU_BOIS.id}/modifier`);
    });

    it("n'offre pas de suppression : le producteur garde la trace des produits et des commandes", () => {
        expect(element().querySelector('button[aria-label^="Supprimer"]')).toBeNull();
    });
});
