# FitMarket Milestone 1 — Orders and finance audit

## Order ownership
Previously, `Sales.completeSale()` saved browser-local purchases without customer identifiers. A shared order-history list would reveal other people's purchases on the same browser. New checkouts require sign-in, save `customerId` plus a snapshot of each `productName`, and expose account-filtered order history at `/shop/orders`. Both the list and `/shop/order/:id` reject orders belonging to another account. Old local sales lacking `customerId` are retained for financial totals but not assigned to an account. This is frontend demo logic, not backend security.

## Budget data accuracy
Old seed records were fictional: Training income 18,000, Training expense 7,200, Shop expense 2,600, Events income 4,500, Events expense 5,200 EGP. They total income 22,500, expense 20,000, balance 2,500, but do not describe actual user transactions. They have now been removed.

New ledger entries include completed Shop sales using post-discount totals once, paid membership records as Training income, and manually entered income/expense entries persisted in localStorage. Unpaid invoices are excluded. Charts and totals use existing department/date filtering and integer-cents aggregation.

**Limits:** Payroll salaries/commissions, refunds, tax and unrecorded costs are not automatically added to this ledger. Payroll still has its own demonstration sales. Therefore **budget balance is not audited profit**, and manual records are not authoritative financial data.

## Validation checklist
- Log in, buy a product, reload and view your receipt and My Orders.
- Switch to a different login in the same browser; order history and direct order URL must not expose the previous account's purchase.
- Confirm Shop budget revenue equals the final after-discount price, not subtotal.
- Pay a membership invoice; Training income should rise by the paid amount. Unpaid invoices must not affect it.
- Add a manual Events expense, reload and verify persistence, filtering, and balance.
- Test role restrictions, responsive pages, `npm run build` and `npm test -- --watch=false`.
