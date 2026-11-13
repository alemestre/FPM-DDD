import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbCarouselConfig } from '@ng-bootstrap/ng-bootstrap';
import { About } from './about';

describe('About', () => {
    let component: About;
    let fixture: ComponentFixture<About>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [About],
        }).compileComponents();

        TestBed.inject(NgbCarouselConfig).animation = false;
        fixture = TestBed.createComponent(About);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should show the next slide when clicking the next arrow', async () => {
        const element = fixture.nativeElement as HTMLElement;
        const activeTitle = () => element.querySelector('.carousel-item.active h3')?.textContent;

        expect(element.querySelectorAll('.carousel-item').length).toBe(4);
        expect(activeTitle()).toBe("L'élevage bovin");

        element.querySelector<HTMLButtonElement>('.carousel-control-next')?.click();
        await fixture.whenStable();

        expect(activeTitle()).toBe('Nos volailles');
    });

    it('should open the directions to the shop in a new tab', () => {
        const element = fixture.nativeElement as HTMLElement;
        const link = element.querySelector<HTMLAnchorElement>('a[href*="google.com/maps/dir"]');

        expect(link?.href).toContain('destination=1+le+Petit+Marais+57645+Retonfey');
        expect(link?.target).toBe('_blank');
        expect(link?.rel).toContain('noopener');
    });

    it('should show the shop phone and email as clickable links', () => {
        const element = fixture.nativeElement as HTMLElement;

        expect(element.querySelector('a[href="tel:+33667255287"]')?.textContent?.trim()).toBe(
            '06 67 25 52 87',
        );
        expect(
            element
                .querySelector('a[href="mailto:lafermedupetitmarais@gmail.com"]')
                ?.textContent?.trim(),
        ).toBe('lafermedupetitmarais@gmail.com');
    });

    it('should show the slide matching the clicked indicator', async () => {
        const element = fixture.nativeElement as HTMLElement;

        element.querySelectorAll<HTMLButtonElement>('.carousel-indicators button')[3].click();
        await fixture.whenStable();

        expect(element.querySelector('.carousel-item.active h3')?.textContent).toBe(
            'Nos fruits et légumes',
        );
    });
});
