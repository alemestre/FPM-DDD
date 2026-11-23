import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { ForgotPassword } from './forgot-password';

const FORGOT_PASSWORD_URL = `${environment.apiUrl}/forgot-password`;

describe('ForgotPassword', () => {
  let fixture: ComponentFixture<ForgotPassword>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForgotPassword],
      providers: [provideRouter([{ path: '**', children: [] }]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ForgotPassword);
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  const element = () => fixture.nativeElement as HTMLElement;
  const text = () => element().textContent ?? '';
  const settle = async () => {
    await fixture.whenStable();
    fixture.detectChanges();
  };
  const submit = async (email: string) => {
    const input = element().querySelector<HTMLInputElement>('#forgot-password-email');
    if (!input) {
      throw new Error('Champ forgot-password-email absent');
    }
    input.value = email;
    input.dispatchEvent(new Event('input'));
    element().querySelector('form')?.dispatchEvent(new Event('submit'));
    await settle();
  };

  it("refuse une adresse e-mail invalide sans appeler l'API", async () => {
    await submit('pas-une-adresse');

    http.expectNone(FORGOT_PASSWORD_URL);
    expect(text()).toContain("L'adresse e-mail n'est pas valide.");
    expect(text()).not.toContain('vous allez recevoir un e-mail');
  });

  it("envoie l'adresse à l'API et confirme sans révéler si le compte existe", async () => {
    await submit('marie.durand@example.fr');

    const request = http.expectOne(FORGOT_PASSWORD_URL);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: 'marie.durand@example.fr' });
    request.flush(null, { status: 204, statusText: 'No Content' });
    await settle();

    expect(text()).toContain('Si un compte est associé à cette adresse');
    expect(element().querySelector('form')).toBeNull();
  });

  it("affiche une erreur et garde le formulaire si l'API échoue", async () => {
    await submit('marie.durand@example.fr');

    http.expectOne(FORGOT_PASSWORD_URL).flush(null, { status: 500, statusText: 'Server Error' });
    await settle();

    expect(text()).toContain('Une erreur est survenue. Veuillez réessayer.');
    expect(text()).not.toContain('Si un compte est associé à cette adresse');
    expect(element().querySelector('form')).not.toBeNull();
  });

  it('propose de revenir à la connexion', () => {
    expect(element().querySelector('a[href="/login"]')?.textContent).toContain('Retour à la connexion');
  });
});
