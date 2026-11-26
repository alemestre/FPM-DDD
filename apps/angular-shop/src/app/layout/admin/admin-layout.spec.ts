import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Component, signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import type { User } from '../../models/entities/user';
import { AuthService } from '../../services/auth.service';
import { AdminLayout } from './admin-layout';

const ADMIN: User = { id: 'a-1', email: 'admin@example.fr', firstName: 'Alice', lastName: 'Martin', role: 'ADMIN' };

describe('AdminLayout', () => {
  let fixture: ComponentFixture<AdminLayout>;
  const authService = { currentUser: signal<User | null>(ADMIN), logout: vi.fn(() => of(null)) };

  beforeEach(async () => {
    authService.logout.mockClear();
    await TestBed.configureTestingModule({
      imports: [AdminLayout],
      providers: [provideRouter([]), { provide: AuthService, useValue: authService }]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminLayout);
    await fixture.whenStable();
  });

  const element = () => fixture.nativeElement as HTMLElement;
  const logoutButton = () =>
    [...element().querySelectorAll('button')].find((button) => button.textContent?.includes('Déconnexion'));

  it("affiche le nom de l'admin connecté", () => {
    expect(element().textContent).toContain('Alice Martin');
    expect(element().textContent).toContain('Administration');
  });

  it('déconnecte puis ouvre /admin/login', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

    logoutButton()?.click();

    expect(authService.logout).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/admin/login');
  });

  it("ouvre aussi /admin/login quand l'API échoue", () => {
    authService.logout.mockReturnValueOnce(throwError(() => new Error('réseau')));
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

    logoutButton()?.click();

    expect(navigate).toHaveBeenCalledWith('/admin/login');
  });

  it('affiche les rubriques de la sidebar', () => {
    const labels = [...element().querySelectorAll('nav a.nav-link')].map((link) => link.textContent?.trim());

    expect(labels).toEqual(['Tableau de bord', 'Produits', 'Catégories', 'Producteurs', 'Commandes', 'Utilisateurs']);
  });

  describe('sidebar sur mobile', () => {
    const sidebar = () => element().querySelector('#admin-sidebar') as HTMLElement;
    const openButton = () => element().querySelector('[aria-label="Ouvrir le menu"]') as HTMLButtonElement;
    const backdrop = () => element().querySelector('.offcanvas-backdrop') as HTMLElement | null;

    const open = async () => {
      openButton().click();
      await fixture.whenStable();
    };

    it("s'ouvre avec le bouton menu", async () => {
      expect(sidebar().classList).not.toContain('show');

      await open();

      expect(sidebar().classList).toContain('show');
      expect(openButton().getAttribute('aria-expanded')).toBe('true');
      expect(backdrop()).not.toBeNull();
    });

    it('se ferme en cliquant sur le fond', async () => {
      await open();

      backdrop()?.click();
      await fixture.whenStable();

      expect(sidebar().classList).not.toContain('show');
      expect(backdrop()).toBeNull();
    });

    it('se ferme avec Échap', async () => {
      await open();

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      await fixture.whenStable();

      expect(sidebar().classList).not.toContain('show');
    });

    it('se ferme en choisissant une rubrique', async () => {
      vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
      await open();

      (element().querySelector('nav a.nav-link') as HTMLElement).click();
      await fixture.whenStable();

      expect(sidebar().classList).not.toContain('show');
    });
  });
});

@Component({ template: '' })
class EmptyPage {}

describe('AdminLayout, rubrique active', () => {
  const activeLinks = async (url: string) => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'admin', component: AdminLayout, children: [{ path: '**', component: EmptyPage }] }]),
        { provide: AuthService, useValue: { currentUser: signal(ADMIN), logout: vi.fn() } }
      ]
    });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    return [...(harness.fixture.nativeElement as HTMLElement).querySelectorAll('nav a.nav-link.active')];
  };

  it('met en évidence la rubrique sur ses sous-pages', async () => {
    const links = await activeLinks('/admin/producteurs/12/modifier');

    expect(links.map((link) => link.textContent?.trim())).toEqual(['Producteurs']);
    expect(links[0].getAttribute('aria-current')).toBe('page');
  });

  it('met en évidence le tableau de bord seulement sur /admin', async () => {
    const links = await activeLinks('/admin');

    expect(links.map((link) => link.textContent?.trim())).toEqual(['Tableau de bord']);
  });
});
