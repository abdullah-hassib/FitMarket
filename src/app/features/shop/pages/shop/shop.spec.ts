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

it('should filter products by search query', async () => {
  component.searchQuery.set('gym');

  await fixture.whenStable();

  const compiled = fixture.nativeElement as HTMLElement;
  const cards = compiled.querySelectorAll('app-product-card');

  expect(cards.length).toBe(1);
  expect(compiled.textContent).toContain('Gym Training Shirt');
});

it('should filter products by category', async () => {
  component.selectedCategory.set('Equipment');

  await fixture.whenStable();

  const compiled = fixture.nativeElement as HTMLElement;
  const cards = compiled.querySelectorAll('app-product-card');

  expect(cards.length).toBe(1);
  expect(compiled.textContent).toContain('Adjustable Dumbbell');
});

it('should sort products by price ascending', async () => {
  component.sortOrder.set('price-low');

  await fixture.whenStable();

  const products = component.filteredProducts();
  const prices = products.map(p => p.price);

  expect(prices).toEqual([650, 900, 2200, 2500]);
});
});
