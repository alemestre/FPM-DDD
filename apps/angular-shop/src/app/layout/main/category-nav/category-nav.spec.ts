import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { CategoryNav } from './category-nav';

describe('CategoryNav', () => {
    let fixture: ComponentFixture<CategoryNav>;
    let element: HTMLElement;
    let http: HttpTestingController;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CategoryNav],
            providers: [
                provideRouter([{ path: '**', children: [] }]),
                provideHttpClient(),
                provideHttpClientTesting(),
            ],
        }).compileComponents();

        http = TestBed.inject(HttpTestingController);
        fixture = TestBed.createComponent(CategoryNav);
        element = fixture.nativeElement as HTMLElement;
        fixture.detectChanges();
        http.expectOne(`${environment.apiUrl}/categories`).flush({
            success: true,
            data: [
                { id: 'cat-1', name: 'viandes', slug: 'viandes' },
                { id: 'cat-2', name: 'fruits & légumes', slug: 'fruits-legumes' },
            ],
        });
        await fixture.whenStable();
    });

    afterEach(() => http.verify());

    it('should list each category, with the about link last', () => {
        const links = Array.from(
            element.querySelectorAll<HTMLAnchorElement>('.app-categories > .nav-item > a'),
        );

        expect(links.map((link) => link.textContent?.trim())).toEqual([
            'Viandes',
            'Fruits & Légumes',
            'À propos',
        ]);
        expect(links.map((link) => link.getAttribute('href'))).toEqual([
            '/produits/viandes',
            '/produits/fruits-legumes',
            '/a-propos',
        ]);
    });

    it('should close the menu when clicking a link', async () => {
        fixture.componentInstance.menuOpen.set(true);
        await fixture.whenStable();

        const link = element.querySelector<HTMLAnchorElement>('.app-categories a');
        if (!link) throw new Error('Category link not found');
        link.click();
        await fixture.whenStable();

        expect(fixture.componentInstance.menuOpen()).toBe(false);
    });

    it('should not have a Produits dropdown', () => {
        const toggles = Array.from(element.querySelectorAll('button.dropdown-toggle'));

        expect(toggles.some((toggle) => toggle.textContent?.includes('Produits'))).toBe(false);
    });

    it("garde le lien « À propos » si les catégories n'ont pas pu être chargées", async () => {
        const errorFixture = TestBed.createComponent(CategoryNav);
        errorFixture.detectChanges();
        http.expectOne(`${environment.apiUrl}/categories`).flush('boom', {
            status: 500,
            statusText: 'Server Error',
        });
        await errorFixture.whenStable();

        const links = Array.from(
            (errorFixture.nativeElement as HTMLElement).querySelectorAll('.app-categories > .nav-item > a'),
        );
        expect(links.map((link) => link.textContent?.trim())).toEqual(['À propos']);
    });
});
