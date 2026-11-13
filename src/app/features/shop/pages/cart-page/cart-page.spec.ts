import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CartPage } from './cart-page';
import { provideRouter } from '@angular/router';

describe('CartPage', () => {
  let component: CartPage;
  let fixture: ComponentFixture<CartPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CartPage],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(CartPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });


it('should display an empty cart message', () => {
  const compiled = fixture.nativeElement as HTMLElement;

  expect(compiled.textContent).toContain('Your cart is empty');
});

it('should display added products', async () => {
  component.cart.addItem(1, 2);

  await fixture.whenStable();

  const compiled = fixture.nativeElement as HTMLElement;

  expect(compiled.textContent).toContain('Adjustable Dumbbell');
  expect(compiled.textContent).toContain('5000');
});

it('should increase product quantity', async () => {
  component.cart.addItem(1, 2);

  component.increase(1, 2);

  await fixture.whenStable();

  expect(component.cart.items()[0].quantity).toBe(3);
});

it('should decrease product quantity', async () => {
  component.cart.addItem(1, 3);

  component.decrease(1, 3);

  await fixture.whenStable();

  expect(component.cart.items()[0].quantity).toBe(2);
});

it('should remove products from the cart', async () => {
  component.cart.addItem(1, 2);

  component.remove(1);

  await fixture.whenStable();

  expect(component.cart.items()).toEqual([]);
});

});
