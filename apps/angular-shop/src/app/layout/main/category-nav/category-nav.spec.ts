import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { CategoriesService } from '../../../services/categories.service';
import { CategoryNav } from './category-nav';

describe('CategoryNav', () => {
    let fixture: ComponentFixture<CategoryNav>;
    let element: HTMLElement;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CategoryNav],
            providers: [
                provideRouter([{ path: '**', children: [] }]),
                {
                    provide: CategoriesService,
                    useValue: {
                        getAllCategories: () =>
                            of([
                                { id: 'cat-1', name: 'viandes', slug: 'viandes' },
                                { id: 'cat-2', name: 'fruits & légumes', slug: 'fruits-legumes' },
                            ]),
                    },
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(CategoryNav);
        element = fixture.nativeElement as HTMLElement;
        await fixture.whenStable();
    });

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
});
