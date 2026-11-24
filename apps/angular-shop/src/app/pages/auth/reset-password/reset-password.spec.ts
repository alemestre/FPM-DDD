import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ResetPassword } from './reset-password';

const VERIFY_URL = `${environment.apiUrl}/verify-forgot-password-token`;
const RESET_URL = `${environment.apiUrl}/reset-password`;

describe('ResetPassword', () => {
  let fixture: ComponentFixture<ResetPassword>;
  let http: HttpTestingController;

  const setup = async (token: string | null) => {
    await TestBed.configureTestingModule({
      imports: [ResetPassword],
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
    fixture = TestBed.createComponent(ResetPassword);
    fixture.detectChanges();
  };

  const element = () => fixture.nativeElement as HTMLElement;
  const text = () => element().textContent ?? '';
  const settle = async () => {
    await fixture.whenStable();
    fixture.detectChanges();
  };

  /** Ouvre la page avec un jeton accepté par l'API : le formulaire est affiché. */
  const openWithValidToken = async () => {
    await setup('reset.jwt.token');
    http.expectOne(VERIFY_URL).flush(null, { status: 204, statusText: 'No Content' });
    await settle();
  };

  const type = (selector: string, value: string) => {
    const input = element().querySelector<HTMLInputElement>(selector);
    if (!input) {
      throw new Error(`Champ ${selector} absent`);
    }
    input.value = value;
    input.dispatchEvent(new Event('input'));
  };

  const submit = () => element().querySelector<HTMLFormElement>('form')?.dispatchEvent(new Event('submit'));

  afterEach(() => http.verify());

  it("vérifie le jeton du lien auprès de l'API puis affiche le formulaire", async () => {
    await setup('reset.jwt.token');

    expect(text()).toContain('Vérification du lien…');
    const request = http.expectOne(VERIFY_URL);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ token: 'reset.jwt.token' });

    request.flush(null, { status: 204, statusText: 'No Content' });
    await settle();

    expect(element().querySelector('#reset-password')).not.toBeNull();
    expect(element().querySelector('#reset-confirmation-password')).not.toBeNull();
  });

  it('signale un lien invalide ou expiré (400) et propose un nouveau lien', async () => {
    await setup('expired.jwt.token');

    http.expectOne(VERIFY_URL).flush({ message: 'expiré' }, { status: 400, statusText: 'Bad Request' });
    await settle();

    expect(text()).toContain('Ce lien est invalide ou a expiré.');
    const newLink = element().querySelector('a[href="/mot-de-passe-oublie"]');
    expect(newLink?.textContent).toContain('Demander un nouveau lien');
    expect(element().querySelector('form')).toBeNull();
  });

  it("considère un lien sans jeton comme invalide, sans appeler l'API", async () => {
    await setup(null);
    await settle();

    http.expectNone(VERIFY_URL);
    expect(text()).toContain('Ce lien est invalide ou a expiré.');
  });

  it('propose de réessayer après une erreur serveur, puis affiche le formulaire', async () => {
    await setup('reset.jwt.token');

    http.expectOne(VERIFY_URL).flush(null, { status: 500, statusText: 'Server Error' });
    await settle();
    expect(text()).toContain("La vérification n'a pas pu aboutir.");

    element().querySelector<HTMLButtonElement>('button')?.click();
    fixture.detectChanges();
    http.expectOne(VERIFY_URL).flush(null, { status: 204, statusText: 'No Content' });
    await settle();

    expect(element().querySelector('#reset-password')).not.toBeNull();
  });

  it('affiche ou masque les deux mots de passe', async () => {
    await openWithValidToken();
    const toggle = element().querySelector<HTMLButtonElement>('button[aria-pressed]');

    toggle?.click();
    fixture.detectChanges();
    expect(element().querySelector<HTMLInputElement>('#reset-password')?.type).toBe('text');
    expect(element().querySelector<HTMLInputElement>('#reset-confirmation-password')?.type).toBe('text');

    toggle?.click();
    fixture.detectChanges();
    expect(element().querySelector<HTMLInputElement>('#reset-password')?.type).toBe('password');
  });

  it('envoie le jeton et le nouveau mot de passe, puis confirme la modification', async () => {
    await openWithValidToken();

    type('#reset-password', 'Nouveau-Secret1');
    type('#reset-confirmation-password', 'Nouveau-Secret1');
    submit();
    fixture.detectChanges();

    const request = http.expectOne(RESET_URL);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ token: 'reset.jwt.token', password: 'Nouveau-Secret1' });
    request.flush(null, { status: 204, statusText: 'No Content' });
    await settle();

    expect(text()).toContain('Votre mot de passe a été modifié.');
    expect(element().querySelector('a[href="/login"]')?.textContent).toContain('Se connecter');
  });

  it("n'envoie rien si les mots de passe ne correspondent pas", async () => {
    await openWithValidToken();

    type('#reset-password', 'Nouveau-Secret1');
    type('#reset-confirmation-password', 'Autre-Secret1');
    submit();
    await settle();

    http.expectNone(RESET_URL);
    expect(text()).toContain('Les mots de passe ne correspondent pas.');
  });

  it.each([
    ['le lien est devenu invalide', 'Le lien de réinitialisation est invalide ou a expiré'],
    ['le mot de passe est identique à l’actuel', "Le nouveau mot de passe doit être différent de l'actuel"]
  ])('affiche la raison du refus de l’API (400) quand %s', async (_case, message) => {
    await openWithValidToken();

    type('#reset-password', 'Nouveau-Secret1');
    type('#reset-confirmation-password', 'Nouveau-Secret1');
    submit();
    fixture.detectChanges();

    http.expectOne(RESET_URL).flush({ statusCode: 400, message }, { status: 400, statusText: 'Bad Request' });
    await settle();

    expect(text()).toContain(message);
    expect(text()).not.toContain('Votre mot de passe a été modifié.');
  });
});
