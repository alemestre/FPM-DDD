import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { VerifyEmail } from './verify-email';

const VERIFY_URL = `${environment.apiUrl}/verify-email`;
const RESEND_URL = `${environment.apiUrl}/resend-verification`;

describe('VerifyEmail', () => {
  let fixture: ComponentFixture<VerifyEmail>;
  let http: HttpTestingController;

  const setup = async (token: string | null) => {
    await TestBed.configureTestingModule({
      imports: [VerifyEmail],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap(token === null ? {} : { token }) } }
        }
      ]
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(VerifyEmail);
    fixture.detectChanges();
  };

  const text = () => (fixture.nativeElement as HTMLElement).textContent ?? '';
  const settle = async () => {
    await fixture.whenStable();
    fixture.detectChanges();
  };

  /** Saisit l'adresse dans le formulaire de renvoi et le soumet. */
  const submitResend = (email: string) => {
    const element = fixture.nativeElement as HTMLElement;
    const input = element.querySelector<HTMLInputElement>('#resend-email');
    const resendForm = element.querySelector<HTMLFormElement>('form');
    if (!input || !resendForm) {
      throw new Error('Formulaire de renvoi absent');
    }
    input.value = email;
    input.dispatchEvent(new Event('input'));
    resendForm.dispatchEvent(new Event('submit'));
  };

  afterEach(() => http.verify());

  it('envoie le jeton du lien à l’API et affiche la confirmation', async () => {
    await setup('signed.jwt.token');

    expect(text()).toContain('Vérification de votre adresse e-mail…');
    const request = http.expectOne(VERIFY_URL);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ token: 'signed.jwt.token' });

    request.flush(null, { status: 204, statusText: 'No Content' });
    await settle();

    expect(text()).toContain('Votre adresse e-mail est confirmée.');
    const loginLink = (fixture.nativeElement as HTMLElement).querySelector('a[href="/login"]');
    expect(loginLink?.textContent).toContain('Se connecter');
  });

  it('signale un lien invalide ou expiré (400) et propose un nouveau lien', async () => {
    await setup('expired.jwt.token');

    http.expectOne(VERIFY_URL).flush({ message: 'expiré' }, { status: 400, statusText: 'Bad Request' });
    await settle();

    expect(text()).toContain('Ce lien de vérification est invalide ou a expiré.');
    expect(text()).toContain('Recevoir un nouveau lien');
  });

  it("considère un lien sans jeton comme invalide, sans appeler l'API", async () => {
    await setup(null);
    await settle();

    http.expectNone(VERIFY_URL);
    expect(text()).toContain('Ce lien de vérification est invalide ou a expiré.');
  });

  it('propose de réessayer après une erreur serveur, puis confirme', async () => {
    await setup('signed.jwt.token');

    http.expectOne(VERIFY_URL).flush(null, { status: 500, statusText: 'Server Error' });
    await settle();
    expect(text()).toContain("La vérification n'a pas pu aboutir.");

    const retry = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button');
    retry?.click();
    fixture.detectChanges();
    http.expectOne(VERIFY_URL).flush(null, { status: 204, statusText: 'No Content' });
    await settle();

    expect(text()).toContain('Votre adresse e-mail est confirmée.');
  });

  it("demande un nouveau lien pour l'adresse saisie et affiche un message neutre", async () => {
    await setup(null);
    await settle();

    submitResend('marie.durand@example.fr');
    fixture.detectChanges();

    const request = http.expectOne(RESEND_URL);
    expect(request.request.body).toEqual({ email: 'marie.durand@example.fr' });
    request.flush(null, { status: 204, statusText: 'No Content' });
    await settle();

    expect(text()).toContain('un nouveau lien vient de lui être envoyé');
  });

  it("n'envoie pas de demande si l'adresse saisie est invalide", async () => {
    await setup(null);
    await settle();

    submitResend('pas-un-email');
    await settle();

    http.expectNone(RESEND_URL);
    expect(text()).toContain("L'adresse e-mail n'est pas valide.");
  });
});
