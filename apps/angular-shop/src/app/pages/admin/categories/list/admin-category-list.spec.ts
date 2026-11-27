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

  it('affiche une ligne par catégorie, avec les liens vers la fiche et la modification', () => {
    expect(rows()).toEqual(['Fruits', 'Légumes']);
    expect(element().querySelector(`a[aria-label="Modifier Fruits"]`)?.getAttribute('href')).toBe(`/${FRUITS.id}/modifier`);
  });

  it("n'offre pas de suppression : la catégorie garde la trace des produits et des commandes", () => {
    expect(element().querySelector('button[aria-label^="Supprimer"]')).toBeNull();
  });
});
