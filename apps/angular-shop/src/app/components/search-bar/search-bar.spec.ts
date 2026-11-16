import { TestBed } from '@angular/core/testing';
import { SearchBar } from './search-bar';

describe('SearchBar', () => {
    const setup = () => {
        const fixture = TestBed.createComponent(SearchBar);
        fixture.detectChanges();
        const field = (fixture.nativeElement as HTMLElement).querySelector(
            'input',
        ) as HTMLInputElement;
        return { fixture, field };
    };

    const type = (field: HTMLInputElement, value: string) => {
        field.value = value;
        field.dispatchEvent(new Event('input'));
    };

    it('met à jour la valeur à chaque frappe', () => {
        const { fixture, field } = setup();

        type(field, 'p');
        expect(fixture.componentInstance.query()).toBe('p');

        type(field, 'po');
        expect(fixture.componentInstance.query()).toBe('po');
    });

    it('affiche la valeur reçue du parent', () => {
        const { fixture, field } = setup();

        fixture.componentRef.setInput('query', 'œufs');
        fixture.detectChanges();

        expect(field.value).toBe('œufs');
    });
});
