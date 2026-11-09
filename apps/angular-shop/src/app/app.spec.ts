import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [App],
            providers: [provideRouter([])],
        }).compileComponents();
    });

    // La navbar appartient désormais aux layouts (voir main-layout.spec.ts et auth-layout.spec.ts).
    it('should only render the router outlet', async () => {
        const fixture = TestBed.createComponent(App);
        await fixture.whenStable();
        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.querySelector('nav.navbar')).toBeNull();
        expect(compiled.querySelector('router-outlet')).not.toBeNull();
    });
});
