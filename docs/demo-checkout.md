# Demo checkout and Bonus 1 feedback

This milestone is frontend-only. The UI intentionally looks like a payment form, but it **must not** be used for real payment credentials.

## Try it
1. Log in with a demo trainee account and add a product to the cart.
2. Open **Shop → Cart → Proceed to Checkout**.
3. Choose **Test Visa** (4242 4242 4242 4242) or **Test Mastercard** (5555 5555 5555 4444). Use a future MM/YY, e.g. 12/30, and a three-digit fictional CVV, e.g. 123. Confirm the demo payment.
4. Use **Declined test card** (4000 0000 0000 0002) to demonstrate a rejection. The cart and stock remain unchanged.
5. After approval, the order receipt shows method + last four digits. Shop budgets automatically pick up the completed sale.
6. The navbar has **Sound off/on**, off by default. It uses small browser-generated tones. Add to Cart, successful checkout and membership payments provide visual feedback; sound plays only when opted in.

## Architecture
- `DemoPayment.authorize()` validates the predetermined test numbers, format and demo CVV entirely in memory and produces a minimal payment receipt.
- `Sales.completeSale(receipt)` re-checks authenticated customer/cart/stock, creates the order and updates inventory exactly once.
- Only `{method, last4, status:'demo-paid'}` is saved in `SaleRecord` in localStorage. No full card number, expiry, cardholder name or CVV is stored or sent anywhere.
- `Feedback` is a shared Angular Signal-based notification service; `FeedbackToast` displays accessible, dismissible toasts.
- `Sound` uses the Web Audio API and a localStorage opt-in preference; it never autoplays on page load. Success tones trigger from checkout, not viewing old receipts. Respect `prefers-reduced-motion`.
- Declines, invalid entries, absent sign-in and stock changes cannot create an order. Existing historical orders without payment metadata still render.

## Verification
Run `npm test -- --no-watch --browsers=ChromeHeadless` and `npm run test:vitest`, followed by `npm run build`. The browser visual smoke script tests approved and declined demo checkout flows at desktop and mobile widths, and saves screenshots as CI artifacts.

**Limitation:** This is not a secure payments implementation or a real authorization boundary. Only a backend/payment provider can securely process actual payments or enforce cross-user isolation in production.
