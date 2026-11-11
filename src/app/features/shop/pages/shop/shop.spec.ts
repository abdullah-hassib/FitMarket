import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Shop } from './shop';

describe('Shop', () => {
  let component: Shop;
  let fixture: ComponentFixture<Shop>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Shop],
    }).compileComponents();

    fixture = TestBed.createComponent(Shop);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

it('should display all four products', () => {
  const compiled = fixture.nativeElement as HTMLElement;

  const productCards = compiled.querySelectorAll(
    'app-product-card'
  );

  expect(productCards.length).toBe(4);
});

it('should display out of stock for unavailable products', () => {
  const compiled = fixture.nativeElement as HTMLElement;

  expect(compiled.textContent).toContain('Out of Stock');
});

});
