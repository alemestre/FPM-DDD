import { CheckoutSessionService } from '../../../services/checkout-session.service';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { Identification } from './identification';

describe('Identification', () => {
    beforeEach(() => sessionStorage.clear());

    const createComponent = async () => {
        TestBed.configureTestingModule({
            imports: [Identification],
            providers: [
                provideRouter([{ path: '**', children: [] }]),
                provideHttpClient(),
                provideHttpClientTesting(),
            ],
        });
        const fixture = TestBed.createComponent(Identification);
        await fixture.whenStable();
        return { fixture, element: fixture.nativeElement as HTMLElement };
    };

    it('propose de se connecter avec le formulaire de connexion ou de commander en invité', async () => {
        const { element } = await createComponent();

        expect(element.querySelector('app-login #login-email')).not.toBeNull();
        expect(element.textContent).toContain('suivre vos commandes');
        expect(element.textContent).toContain("Continuer en tant qu'invité");
        expect(element.textContent).not.toContain('Créer un compte');
    });

    it('enregistre le choix invité puis ouvre la page checkout', async () => {
        const { element } = await createComponent();
        const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

        [...element.querySelectorAll('button')]
            .find((button) => button.textContent?.includes('invité'))
            ?.click();

        expect(TestBed.inject(CheckoutSessionService).isGuest()).toBe(true);
        expect(sessionStorage.getItem('fpm_checkout_guest')).toBe('true');
        expect(navigate).toHaveBeenCalledWith('/checkout');
    });
});
