import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
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
});
