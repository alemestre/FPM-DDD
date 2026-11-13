import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { CategoriesService } from '../../services/categories.service';
import { By } from '@angular/platform-browser';
import { MainLayout } from './main-layout';
import { CategoryNav } from './category-nav/category-nav';

describe('MainLayout', () => {
    let fixture: ComponentFixture<MainLayout>;
    let element: HTMLElement;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MainLayout],
            providers: [
                provideRouter([]),
                {
                    provide: AuthService,
                    useValue: { isConnected: signal(false), logout: () => of(null) },
                },
                { provide: CartService, useValue: { totalItems: signal(0) } },
                {
                    provide: CategoriesService,
                    useValue: {
                        getAllCategories: () =>
                            of([{ id: 'cat-1', name: 'viandes', slug: 'viandes' }]),
                    },
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(MainLayout);
        element = fixture.nativeElement as HTMLElement;
        await fixture.whenStable();
    });

    it('should show the top bar then the category nav in a sticky header', () => {
        const header = element.querySelector('header.sticky-top');

        expect(
            Array.from(header?.children ?? []).map((child) => child.tagName.toLowerCase()),
        ).toEqual(['app-top-bar', 'app-category-nav']);
    });

    it('should open then close the category nav when clicking the burger', async () => {
        const burger = element.querySelector<HTMLButtonElement>('app-top-bar .navbar-toggler');
        if (!burger) throw new Error('Burger button not found');
        // L'état est vérifié sur CategoryNav : la classe "show" de ngbCollapse n'arrive qu'après l'animation.
        const categoryNav = fixture.debugElement.query(By.directive(CategoryNav))
            .componentInstance as CategoryNav;

        expect(categoryNav.menuOpen()).toBe(false);

        burger.click();
        await fixture.whenStable();
        expect(categoryNav.menuOpen()).toBe(true);

        burger.click();
        await fixture.whenStable();
        expect(categoryNav.menuOpen()).toBe(false);
    });

    it('should render the page content in a router outlet', () => {
        expect(element.querySelector('main router-outlet')).toBeTruthy();
    });
});
