import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import {
  ADMIN_CATEGORIES_URL,
  FRUITS,
  categoryPageProviders,
  settle
} from '../testing';
import type { ConfirmDialogService } from '../../../../shared/confirm-dialog/confirm-dialog';
import { AdminCategoryDetail } from './admin-category-detail';

const createConfirmDialog = () => ({ confirm: vi.fn<ConfirmDialogService['confirm']>(async () => true) });
const createNotifications = () => ({ showSuccess: vi.fn(), showError: vi.fn() });

describe('AdminCategoryDetail', () => {
  let http: HttpTestingController;
  let harness: RouterTestingHarness;
  let notifications: ReturnType<typeof createNotifications>;

  beforeEach(async () => {
    notifications = createNotifications();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'admin/categories', children: [] },
          { path: 'admin/categories/:id', component: AdminCategoryDetail }
        ]),
        ...categoryPageProviders(createConfirmDialog(), notifications)
      ]
    });
    http = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create();
  });

  afterEach(() => http.verify());

  const open = async (status = 200) => {
    await harness.navigateByUrl(`/admin/categories/${FRUITS.id}`);
    const request = http.expectOne(`${ADMIN_CATEGORIES_URL}/${FRUITS.id}`);
    if (status === 200) {
      request.flush({ success: true, data: FRUITS });
    } else {
      request.flush({ message: 'Not Found' }, { status, statusText: 'Not Found' });
    }
    await settle();
    return harness.fixture.nativeElement as HTMLElement;
  };

  it('affiche le nom, le slug et le lien vers la page boutique', async () => {
    const element = await open();

    expect(element.querySelector('h1')?.textContent).toContain('Fruits');
    expect(element.querySelector('a[target="_blank"]')?.getAttribute('href')).toBe('/produits/fruits');
  });

  it('affiche « Catégorie introuvable » sur un 404', async () => {
    const element = await open(404);

    expect(element.textContent).toContain('Catégorie introuvable');
  });

  it("n'offre pas de suppression : la catégorie garde la trace des produits et des commandes", async () => {
    const element = await open();

    expect([...element.querySelectorAll('button')].some((button) => button.textContent?.includes('Supprimer'))).toBe(false);
  });
});
