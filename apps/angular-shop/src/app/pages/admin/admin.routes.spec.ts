import { provideHttpClientTesting } from '@angular/common/http/testing';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import type { User } from '../../models/entities/user';
import { AuthService } from '../../services/auth.service';
import { appAdminRoutes } from './admin.routes';

const CATEGORY_ID = 'b3bb189e-8bf9-4888-9912-ace4e6543002';
const PRODUCER_ID = 'c4f2a8d1-3b6e-4f7a-9d2c-1e5b8a7f6c30';
const ADMIN: User = { id: 'a-1', email: 'admin@example.fr', firstName: 'Alice', lastName: 'Martin', role: 'ADMIN' };

describe("routes de l'espace admin", () => {
  const currentUser = signal<User | null>(null);
  const isAdmin = signal(false);

  const harnessAs = async (user: User | null) => {
    currentUser.set(user);
    isAdmin.set(user?.role === 'ADMIN');
    TestBed.configureTestingModule({
      providers: [
        provideRouter(appAdminRoutes),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { currentUser, isAdmin, isConnected: signal(user !== null) } }
      ]
    });
    return RouterTestingHarness.create();
  };

  const currentUrl = () => TestBed.inject(Router).url;

  it('affiche le tableau de bord sur /admin pour un admin', async () => {
    const harness = await harnessAs(ADMIN);

    await harness.navigateByUrl('/admin');

    expect(currentUrl()).toBe('/admin');
    expect(harness.fixture.nativeElement.querySelector('app-admin-home')?.textContent).toContain('Bonjour Alice');
  });

  it('ramène un admin sur le tableau de bord depuis une page admin inconnue', async () => {
    const harness = await harnessAs(ADMIN);
    await harness.navigateByUrl('/admin/inconnue');

    expect(currentUrl()).toBe('/admin');
  });

  it('ramène un admin déjà connecté de /admin/login vers le tableau de bord', async () => {
    const harness = await harnessAs(ADMIN);
    await harness.navigateByUrl('/admin/login');

    expect(currentUrl()).toBe('/admin');
  });

  it.each([
    ['un visiteur', null],
    ['un client', { ...ADMIN, role: 'CUSTOMER' } satisfies User]
  ])('envoie %s de /admin vers /admin/login', async (_case, user) => {
    const harness = await harnessAs(user);
    await harness.navigateByUrl('/admin');

    expect(currentUrl()).toBe('/admin/login');
  });

  it('envoie un visiteur d’une page admin inconnue vers /admin/login, avec le formulaire', async () => {
    const harness = await harnessAs(null);
    await harness.navigateByUrl('/admin/inconnue');

    expect(currentUrl()).toBe('/admin/login');
    expect(harness.fixture.nativeElement.querySelector('app-admin-login')).not.toBeNull();
  });

  it.each(['/admin/commandes', '/admin/commandes/nouveau', '/admin/commandes/12', '/admin/commandes/12/modifier'])(
    'ouvre %s pour un admin',
    async (url) => {
      const harness = await harnessAs(ADMIN);
      await harness.navigateByUrl(url);

      expect(currentUrl()).toBe(url);
      expect(harness.fixture.nativeElement.querySelector('app-admin-placeholder')).not.toBeNull();
    }
  );

  it('affiche le titre de la page CRUD', async () => {
    const harness = await harnessAs(ADMIN);
    await harness.navigateByUrl('/admin/produits/nouveau');

    expect(harness.fixture.nativeElement.querySelector('h1')?.textContent).toContain('Produits — Nouveau');
  });

  it('envoie un visiteur de /admin/commandes vers /admin/login', async () => {
    const harness = await harnessAs(null);
    await harness.navigateByUrl('/admin/commandes');

    expect(currentUrl()).toBe('/admin/login');
  });

  it.each([
    ['/admin/categories', 'app-admin-category-list'],
    ['/admin/categories/nouveau', 'app-admin-category-form'],
    [`/admin/categories/${CATEGORY_ID}`, 'app-admin-category-detail'],
    [`/admin/categories/${CATEGORY_ID}/modifier`, 'app-admin-category-form']
  ])('ouvre %s sur la page catégories', async (url, selector) => {
    const harness = await harnessAs(ADMIN);
    await harness.navigateByUrl(url);

    expect(currentUrl()).toBe(url);
    expect(harness.fixture.nativeElement.querySelector(selector)).not.toBeNull();
  });

  it.each([
    ['/admin/producteurs', 'app-admin-producer-list'],
    ['/admin/producteurs/nouveau', 'app-admin-producer-form'],
    [`/admin/producteurs/${PRODUCER_ID}`, 'app-admin-producer-detail'],
    [`/admin/producteurs/${PRODUCER_ID}/modifier`, 'app-admin-producer-form']
  ])('ouvre %s sur la page producteurs', async (url, selector) => {
    const harness = await harnessAs(ADMIN);
    await harness.navigateByUrl(url);

    expect(currentUrl()).toBe(url);
    expect(harness.fixture.nativeElement.querySelector(selector)).not.toBeNull();
  });
});
