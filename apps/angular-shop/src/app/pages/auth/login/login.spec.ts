import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { Login } from './login';

const LOGIN_URL = `${environment.apiUrl}/login`;
const RESEND_URL = `${environment.apiUrl}/resend-verification`;

describe('Login', () => {
  let fixture: ComponentFixture<Login>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Login);
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  const element = () => fixture.nativeElement as HTMLElement;
  const text = () => element().textContent ?? '';
  const settle = async () => {
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const logIn = async (email: string, password: string) => {
    for (const [id, value] of [
      ['login-email', email],
      ['login-password', password]
    ]) {
      const input = element().querySelector<HTMLInputElement>(`#${id}`);
      if (!input) {
        throw new Error(`Champ ${id} absent`);
      }
      input.value = value;
      input.dispatchEvent(new Event('input'));
    }
    element().querySelector('form')?.dispatchEvent(new Event('submit'));
    await settle();
  };

  const resendButton = () =>
    [...element().querySelectorAll<HTMLButtonElement>('button')].find((button) =>
      button.textContent?.includes("renvoyer l'e-mail")
    );

  it('signale des identifiants incorrects (401), sans proposer de renvoi', async () => {
    await logIn('marie.durand@example.fr', 'Mauvais1!');
    http.expectOne(LOGIN_URL).flush({ message: 'non' }, { status: 401, statusText: 'Unauthorized' });
    await settle();

    expect(text()).toContain('Identifiants incorrects.');
    expect(resendButton()).toBeUndefined();
  });

  it("explique qu'il faut confirmer son e-mail (403) et renvoie le lien à l'adresse saisie", async () => {
    await logIn('marie.durand@example.fr', 'MotDePasse1!');
    http.expectOne(LOGIN_URL).flush({ message: 'non vérifié' }, { status: 403, statusText: 'Forbidden' });
    await settle();

    expect(text()).toContain('Vous devez confirmer votre adresse e-mail avant de vous connecter.');

    resendButton()?.click();
    const request = http.expectOne(RESEND_URL);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: 'marie.durand@example.fr' });
    request.flush(null, { status: 204, statusText: 'No Content' });
    await settle();

    expect(text()).toContain('Un nouveau lien vient de vous être envoyé.');
  });
});
