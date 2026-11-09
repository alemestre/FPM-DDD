import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbCarouselConfig } from '@ng-bootstrap/ng-bootstrap';
import { About } from './about';

describe('About', () => {
  let component: About;
  let fixture: ComponentFixture<About>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [About]
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

  it('should show the slide matching the clicked indicator', async () => {
    const element = fixture.nativeElement as HTMLElement;

    element.querySelectorAll<HTMLButtonElement>('.carousel-indicators button')[3].click();
    await fixture.whenStable();

    expect(element.querySelector('.carousel-item.active h3')?.textContent).toBe(
      'Nos fruits et légumes',
    );
  });
});
