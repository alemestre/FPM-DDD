import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../services/auth.service';
import { Register } from './register';

const REGISTER_URL = `${environment.apiUrl}/register`;
const RESEND_URL = `${environment.apiUrl}/resend-verification`;

const VALID_FIELDS = {
  firstName: ' Marie ',
  lastName: 'Durand',
  email: 'marie.durand@example.fr',
  phone: '06 12 34 56 78',
  password: 'MotDePasse1!',
  confirmationPassword: 'MotDePasse1!'
};

describe('Register', () => {
  let fixture: ComponentFixture<Register>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Register);
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  const element = () => fixture.nativeElement as HTMLElement;
  const text = () => element().textContent ?? '';
  const settle = async () => {
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const fill = (fields: Record<string, string>) => {
    for (const [name, value] of Object.entries(fields)) {
      const input = element().querySelector<HTMLInputElement>(`#register-${name}`);
      if (!input) {
        throw new Error(`Champ ${name} absent`);
      }
      input.value = value;
      input.dispatchEvent(new Event('input'));
    }
  };

  const submit = async () => {
    element().querySelector('form')?.dispatchEvent(new Event('submit'));
    await settle();
  };

  const buttonLabelled = (label: string) =>
    [...element().querySelectorAll<HTMLButtonElement>('button')].find((button) =>
      button.textContent?.includes(label)
    );

  it("crée le compte puis invite à consulter sa boîte mail, sans connecter l'utilisateur", async () => {
    fill(VALID_FIELDS);
    await submit();

    const request = http.expectOne(REGISTER_URL);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      firstName: 'Marie',
      lastName: 'Durand',
      email: 'marie.durand@example.fr',
      phone: '06 12 34 56 78',
      password: 'MotDePasse1!'
    });
    request.flush(
      {
        success: true,
        data: { id: 'u-1', email: 'marie.durand@example.fr', firstName: 'Marie', lastName: 'Durand', role: 'CUSTOMER' }
      },
      { status: 201, statusText: 'Created' }
    );
    await settle();

    expect(text()).toContain('Consultez votre boîte mail');
    expect(text()).toContain('marie.durand@example.fr');
    expect(element().querySelector('form')).toBeNull();
    expect(TestBed.inject(AuthService).isConnected()).toBe(false);
  });

  it('renvoie l’e-mail de confirmation depuis le message de succès', async () => {
    fill(VALID_FIELDS);
    await submit();
    http.expectOne(REGISTER_URL).flush({ success: true, data: {} }, { status: 201, statusText: 'Created' });
    await settle();

    buttonLabelled("renvoyer l'e-mail")?.click();
    const request = http.expectOne(RESEND_URL);
    expect(request.request.body).toEqual({ email: 'marie.durand@example.fr' });
    request.flush(null, { status: 204, statusText: 'No Content' });
    await settle();

    expect(text()).toContain('Un nouveau lien vient de vous être envoyé.');
  });

  it("affiche les règles manquantes d'un mot de passe trop faible, sans appeler l'API", async () => {
    fill({ ...VALID_FIELDS, password: 'motdepasse', confirmationPassword: 'motdepasse' });
    await submit();

    http.expectNone(REGISTER_URL);
    expect(text()).toContain('Au moins une majuscule.');
    expect(text()).toContain('Au moins un chiffre.');
    expect(text()).toContain('Au moins un caractère spécial');
    expect(text()).not.toContain('Au moins 8 caractères.');
  });

  it('signale un e-mail déjà utilisé (409)', async () => {
    fill(VALID_FIELDS);
    await submit();
    http.expectOne(REGISTER_URL).flush({ message: 'conflit' }, { status: 409, statusText: 'Conflict' });
    await settle();

    expect(text()).toContain('Un compte existe déjà avec cette adresse e-mail.');
    expect(element().querySelector('form')).not.toBeNull();
  });
});
