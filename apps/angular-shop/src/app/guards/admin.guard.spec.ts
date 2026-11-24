import type { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { provideRouter, Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { adminGuard, adminLoginGuard } from './admin.guard';
import { AuthService } from '../services/auth.service';

describe('gardes de l’espace admin', () => {
  const isAdmin = signal(false);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: { isAdmin } }]
    });
  });

  const run = (guard: typeof adminGuard) =>
    TestBed.runInInjectionContext(() => guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));
  const url = (result: unknown) => TestBed.inject(Router).serializeUrl(result as UrlTree);

  describe('adminGuard', () => {
    it('laisse passer un admin connecté', () => {
      isAdmin.set(true);
      expect(run(adminGuard)).toBe(true);
    });

    it('envoie un visiteur ou un client vers /admin/login', () => {
      isAdmin.set(false);
      expect(url(run(adminGuard))).toBe('/admin/login');
    });
  });

  describe('adminLoginGuard', () => {
    it('envoie un admin déjà connecté sur le tableau de bord', () => {
      isAdmin.set(true);
      expect(url(run(adminLoginGuard))).toBe('/admin');
    });

    it('affiche le formulaire à un visiteur ou à un client', () => {
      isAdmin.set(false);
      expect(run(adminLoginGuard)).toBe(true);
    });
  });
});
