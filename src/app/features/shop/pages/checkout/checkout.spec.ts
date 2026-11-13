import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { Checkout } from './checkout';
import { Auth } from '../../../../core/auth/auth';
import { Cart } from '../../services/cart';
import { Sales } from '../../services/sales';

describe('demo checkout', () => {
  let component: Checkout;
  let fixture: ComponentFixture<Checkout>;
  let cart: Cart;
  let sales: Sales;
  const user = signal({ id: 42, name: 'Demo Customer', demoCard: 'test-visa' });
  const visited: (string | number)[][] = [];

  beforeEach(async () => {
    visited.length = 0;
    localStorage.removeItem('fitmarket.shop.cart.v1');
    localStorage.removeItem('fitmarket.shop.products.v1');
    localStorage.removeItem('fitmarket.shop.sales.v1');
    localStorage.removeItem('fitmarket_sound_enabled_v1');
    await TestBed.configureTestingModule({
      imports: [Checkout],
      providers: [
        { provide: Auth, useValue: { currentUser: user.asReadonly() } },
        { provide: Router, useValue: { navigate: async (parts: (string | number)[]) => { visited.push(parts); return true; } } }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(Checkout);
    component = fixture.componentInstance;
    cart = TestBed.inject(Cart);
    sales = TestBed.inject(Sales);
    await fixture.whenStable();
  });

  it('shows the form only when a product is in the cart', async () => {
    expect(fixture.nativeElement.textContent).toContain('Your cart is empty');
    cart.addItem(1, 1);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('#demo-card-number')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Test Visa');
  });

  it('does not change stock, sales or cart when card details are invalid', async () => {
    cart.addItem(1, 2);
    component.cardNumber = '4111 1111 1111 1111';
    component.cvv = '123';
    await component.placeOrder();
    expect(sales.sales().length).toBe(0);
    expect(cart.items()[0].quantity).toBe(2);
    expect(component.errorMessage()).toContain('test card');
    expect(component.cvv).toBe('');
    expect(visited.length).toBe(0);
  });

  it('declines the failed test card without placing an order', async () => {
    cart.addItem(1, 1);
    component.selectTestCard('4000 0000 0000 0002');
    component.cvv = '123';
    await component.placeOrder();
    expect(sales.sales()).toEqual([]);
    expect(cart.itemCount()).toBe(1);
    expect(component.errorMessage()).toContain('declined');
  });

  it('creates exactly one approved order despite repeated clicks', async () => {
    cart.addItem(1, 2);
    component.cvv = '123';
    const first = component.placeOrder();
    const duplicate = component.placeOrder();
    expect(component.processing()).toBe(true);
    await Promise.all([first, duplicate]);

    expect(component.processing()).toBe(false);
    expect(sales.sales().length).toBe(1);
    expect(sales.sales()[0].payment).toEqual({ method: 'test-visa', last4: '4242', status: 'demo-paid' });
    expect(JSON.stringify(sales.sales())).not.toContain('"cvv"');
    expect(JSON.stringify(sales.sales())).not.toContain('"cardNumber"');
    expect(cart.items()).toEqual([]);
    expect(visited.length).toBe(1);
    expect(visited[0]).toEqual(['/shop/order', 1]);
  });
});
