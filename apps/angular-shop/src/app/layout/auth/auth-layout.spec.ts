import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthLayout } from './auth-layout';

describe('AuthLayout', () => {
    let fixture: ComponentFixture<AuthLayout>;
    let element: HTMLElement;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AuthLayout],
            providers: [provideRouter([])],
        }).compileComponents();

        fixture = TestBed.createComponent(AuthLayout);
        element = fixture.nativeElement as HTMLElement;
        await fixture.whenStable();
    });

    it('should only show the logo, linked to the home page', () => {
        const brand = element.querySelector<HTMLAnchorElement>('header a.navbar-brand');

        expect(brand?.querySelector('img')).toBeTruthy();
        expect(brand?.getAttribute('href')).toBe('/home');
        expect(element.querySelectorAll('header a')).toHaveLength(1);
    });

    it('should not show the main navigation', () => {
        expect(element.querySelector('nav')).toBeNull();
        expect(element.querySelector('a[href="/login"]')).toBeNull();
    });

    it('should render the page content in a router outlet', () => {
        expect(element.querySelector('main router-outlet')).toBeTruthy();
    });
});
