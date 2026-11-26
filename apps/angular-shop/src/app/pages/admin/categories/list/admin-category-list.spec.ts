import { HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import {
  ADMIN_CATEGORIES_URL,
  FRUITS,
  categoryPageProviders,
  settle
} from '../testing';
import type { ConfirmDialogService } from '../../../../shared/confirm-dialog/confirm-dialog';
import { AdminCategoryList } from './admin-category-list';

const LEGUMES = { id: '5d1c3a2b-7e4f-4a6b-9c8d-0e1f2a3b4c5d', name: 'Légumes', slug: 'legumes' };

const createConfirmDialog = () => ({ confirm: vi.fn<ConfirmDialogService['confirm']>(async () => true) });
const createNotifications = () => ({ showSuccess: vi.fn(), showError: vi.fn() });

describe('AdminCategoryList', () => {
  let fixture: ComponentFixture<AdminCategoryList>;
  let http: HttpTestingController;
  let confirmDialog: ReturnType<typeof createConfirmDialog>;
  let notifications: ReturnType<typeof createNotifications>;

  beforeEach(async () => {
    confirmDialog = createConfirmDialog();
    notifications = createNotifications();
    TestBed.configureTestingModule({
      imports: [AdminCategoryList],
      providers: [provideRouter([]), ...categoryPageProviders(confirmDialog, notifications)]
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AdminCategoryList);
    TestBed.tick();
    http.expectOne(ADMIN_CATEGORIES_URL).flush({ success: true, data: [FRUITS, LEGUMES] });
    await settle();
  });

  afterEach(() => http.verify());

  const element = () => fixture.nativeElement as HTMLElement;
  const rows = () => [...element().querySelectorAll('tbody tr')].map((row) => row.querySelector('td')?.textContent?.trim());
  const deleteButton = (name: string) => element().querySelector<HTMLButtonElement>(`button[aria-label="Supprimer ${name}"]`);

  it('affiche une ligne par catégorie, avec les liens vers la fiche et la modification', () => {
    expect(rows()).toEqual(['Fruits', 'Légumes']);
    expect(element().querySelector(`a[aria-label="Modifier Fruits"]`)?.getAttribute('href')).toBe(`/${FRUITS.id}/modifier`);
  });

  it('supprime après confirmation, puis recharge la liste', async () => {
    deleteButton('Fruits')?.click();
    await settle();

    expect(confirmDialog.confirm).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('Fruits') }));
    const request = http.expectOne(`${ADMIN_CATEGORIES_URL}/${FRUITS.id}`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });
    await settle();

    await vi.waitFor(() => expect(notifications.showSuccess).toHaveBeenCalledWith('Catégorie « Fruits » supprimée'));
    TestBed.tick();
    http.expectOne(ADMIN_CATEGORIES_URL).flush({ success: true, data: [LEGUMES] });
    await settle();
    expect(rows()).toEqual(['Légumes']);
  });

  it("n'envoie rien si l'admin annule", async () => {
    confirmDialog.confirm.mockResolvedValueOnce(false);

    deleteButton('Fruits')?.click();
    await settle();

    http.expectNone(`${ADMIN_CATEGORIES_URL}/${FRUITS.id}`);
  });

  it("affiche le message de l'API si la catégorie est utilisée (409)", async () => {
    deleteButton('Fruits')?.click();
    await settle();

    http
      .expectOne(`${ADMIN_CATEGORIES_URL}/${FRUITS.id}`)
      .flush({ message: 'La catégorie est utilisée par au moins un produit' }, { status: 409, statusText: 'Conflict' });
    await settle();

    await vi.waitFor(() => expect(notifications.showError).toHaveBeenCalledWith('La catégorie est utilisée par au moins un produit'));
    expect(rows()).toEqual(['Fruits', 'Légumes']);
  });
});
