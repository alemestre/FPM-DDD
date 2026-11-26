import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import {
  ADMIN_CATEGORIES_URL,
  FRUITS,
  categoryPageProviders,
  settle
} from '../testing';
import type { ConfirmDialogService } from '../../../../shared/confirm-dialog/confirm-dialog';
import { AdminCategoryForm } from './admin-category-form';

const createConfirmDialog = () => ({ confirm: vi.fn<ConfirmDialogService['confirm']>(async () => true) });
const createNotifications = () => ({ showSuccess: vi.fn(), showError: vi.fn() });

describe('AdminCategoryForm', () => {
  let http: HttpTestingController;
  let harness: RouterTestingHarness;
  let notifications: ReturnType<typeof createNotifications>;

  beforeEach(async () => {
    notifications = createNotifications();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'admin/categories/nouveau', component: AdminCategoryForm },
          { path: 'admin/categories/:id/modifier', component: AdminCategoryForm },
          { path: 'admin/categories/:id', children: [] }
        ]),
        ...categoryPageProviders(createConfirmDialog(), notifications)
      ]
    });
    http = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create();
  });

  afterEach(() => http.verify());

  const element = () => harness.fixture.nativeElement as HTMLElement;
  const nameInput = () => element().querySelector<HTMLInputElement>('#category-name');
  const fillName = async (value: string) => {
    const input = nameInput();
    if (!input) throw new Error('champ Nom absent');
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await settle();
  };
  const submit = async () => {
    element().querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
    await settle();
  };
  const currentUrl = () => TestBed.inject(Router).url;

  describe('ajout', () => {
    beforeEach(async () => {
      await harness.navigateByUrl('/admin/categories/nouveau');
    });

    it('crée la catégorie puis ouvre sa fiche', async () => {
      expect(element().querySelector('h1')?.textContent).toContain('Nouvelle catégorie');
      await fillName('  Fruits ');
      await submit();

      const request = http.expectOne(ADMIN_CATEGORIES_URL);
      expect(request.request.method).toBe('POST');
      // Envoyé tel que saisi : le value object Name de l'API retire les espaces.
      expect(request.request.body).toEqual({ name: '  Fruits ' });
      request.flush({ success: true, data: FRUITS });
      await settle();

      await vi.waitFor(() => expect(currentUrl()).toBe(`/admin/categories/${FRUITS.id}`));
      expect(notifications.showSuccess).toHaveBeenCalledWith('Catégorie créée');
    });

    it("refuse un nom de moins de 3 caractères sans appeler l'API", async () => {
      await fillName('ab');
      await submit();

      http.expectNone(ADMIN_CATEGORIES_URL);
      expect(element().querySelector('.invalid-feedback')?.textContent).toContain('au moins 3 caractères');
    });

    it("affiche le message de l'API sur un nom déjà pris (409)", async () => {
      await fillName('Fruits');
      await submit();

      http
        .expectOne(ADMIN_CATEGORIES_URL)
        .flush({ message: 'Une catégorie avec un nom équivalent existe déjà' }, { status: 409, statusText: 'Conflict' });
      await settle();

      await vi.waitFor(() =>
        expect(element().querySelector('.alert-danger')?.textContent).toContain('Une catégorie avec un nom équivalent existe déjà')
      );
      expect(currentUrl()).toBe('/admin/categories/nouveau');
    });
  });

  describe('modification', () => {
    beforeEach(async () => {
      await harness.navigateByUrl(`/admin/categories/${FRUITS.id}/modifier`);
      http.expectOne(`${ADMIN_CATEGORIES_URL}/${FRUITS.id}`).flush({ success: true, data: FRUITS });
      await settle();
    });

    it('pré-remplit le nom puis enregistre avec PATCH', async () => {
      expect(element().querySelector('h1')?.textContent).toContain('Modifier la catégorie');
      expect(nameInput()?.value).toBe('Fruits');

      await fillName('Légumes');
      await submit();

      const request = http.expectOne(`${ADMIN_CATEGORIES_URL}/${FRUITS.id}`);
      expect(request.request.method).toBe('PATCH');
      expect(request.request.body).toEqual({ name: 'Légumes' });
      request.flush({ success: true, data: { ...FRUITS, name: 'Légumes', slug: 'legumes' } });
      await settle();

      await vi.waitFor(() => expect(currentUrl()).toBe(`/admin/categories/${FRUITS.id}`));
      expect(notifications.showSuccess).toHaveBeenCalledWith('Catégorie modifiée');
    });
  });
});
