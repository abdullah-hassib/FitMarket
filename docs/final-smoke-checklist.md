# Milestone 1 final browser walkthrough

## Role / access
- [ ] Guest sees Home, Shop, Memberships, Login/Signup.
- [ ] Register a trainee with fictional details. Sign in. The session survives refresh, but not an intentionally ended browser tab session.
- [ ] Trainee cannot access `/budgets`, `/payroll`, `/admin/users` or `/admin/products`.
- [ ] Admin/accountant can open permitted finance pages; admin can manage users and products.

## Shopping / orders
- [ ] Search/filter/sort products; empty state and sold-out stock are understandable.
- [ ] Cart increase/decrease observes stock; discount and final total calculate correctly.
- [ ] Checkout requires sign-in, creates order/receipt, reduces stock, and clears cart.
- [ ] `/shop/orders` contains purchaser's order after refresh.
- [ ] Switch to another demo user: neither My Orders nor direct receipt URL reveals the first user's order.

## Memberships / fees / finance
- [ ] A membership request generates an unpaid invoice. An unpaid invoice does NOT contribute to Training income.
- [ ] Simulated payment marks invoice paid, activates membership and increases Training income once.
- [ ] Completed Shop orders increase Shop budget income by the final after-discount amount, not twice.
- [ ] Manual department expense persists after refresh. Filter/chart/table match.
- [ ] Admin/accountant payroll generates a parseable JSON monthly report. Payroll expenses are NOT auto-imported into budgets and should not be described as net profit.

## UX and requirements
- [ ] Cookie preference toggles compact layout and persists after browser restart; no secret value is stored in it.
- [ ] Session/local storage behavior explained in report.
- [ ] Responsive desktop 1440px, tablet 768px, phone 390px; no horizontal page overflow and tables are scrollable when needed.
- [ ] Tab through navigation, forms and checkout; focus visible; images have meaningful alternatives.
- [ ] Production Angular build and Jasmine/Karma tests pass.
- [ ] Three-page report contains actual names, GIU IDs, emails and ACTUAL screenshots, not placeholders.
- [ ] Share runnable code and report using a link accessible to the TA; paste it into the GIU registration sheet before 14 November 2026.

Automated visual smoke screenshots are demo-only. The test script seeds fictional sales/payment records in a disposable Chrome browser; no real user/payment data are involved.
