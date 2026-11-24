import { provideHttpClientTesting } from '@angular/common/http/testing';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import type { User } from '../../models/entities/user';
import { AuthService } from '../../services/auth.service';
import { appAdminRoutes } from './admin.routes';

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
});
