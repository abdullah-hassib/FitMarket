# Omar — homepage and department budgets

Prepared for FitMarket Milestone 1, due 14 November 2026.

## Verification results — 10 November 2026

Base repository: main at 48bd964777cc45ce3733d0cd71387dc4effcded5. The remote feature/budgets-home branch was absent at inspection; the local branch was created from main. Nothing was pushed or merged.

- npm ci completed with the existing lockfile; npm reported zero vulnerabilities. The first attempt hit a registry certificate error; using Node's --use-system-ca resolved it without disabling TLS verification.
- npm test -- --watch=false: 9 test files and 22 tests passed, including existing repository tests. Feature coverage includes calculations, validation, duplicate sales, snapshot replacement, edit behavior, filters, role changes, lazy loading and following a home RouterLink.
- npm run build passed against the unchanged shared integration files. A second production build in an isolated copy connected the proposed home/budget routes and emitted separate home-page and budgets-page lazy chunks, with no budget warnings. The original shared files were left untouched.
- Browser screenshots and visual/manual accessibility checks have not been performed. Use the checklist below after team integration. Responsive rules and screen-reader alternatives are implemented; automated component tests do not replace a browser layout review.

The archive contains only Omar's source additions and this handoff. Copy its src/app/features folders into the existing project, or apply the accompanying patch from the repository root with git apply --check followed by git apply. Do not create a second Angular project. The patch adds files only; if a teammate has already created these paths, compare them before applying.

## What is included

- Public standalone HomePage: academy introduction, membership information, shop information, and RouterLink calls to signup, login, memberships, shop and profile.
- Standalone BudgetsPage: Training, Shop and Events; add/edit manual records; date and department filters; income, expenses and balance cards; responsive comparison bars and a labelled data table with the same values.
- Feature-local models, validation, cents-based calculations, a signal store, an access token and a route guard. No global CSS, shared contracts, navbar or app.routes.ts changes.
- Unit tests use the repository's configured Vitest runner. No new dependencies.

## Hassib: route and authentication integration

The feature denies access by default. Main does not have authentication yet. Do not remove this default or hard-code an accountant role to make the screen visible. After the auth contribution is integrated, add these imports and provider in the existing app configuration:

```ts
import { inject } from '@angular/core';
import { Auth } from './core/auth/auth';
import { BUDGET_ROLE } from './features/budgets/services/budget-access';

// Add to the existing providers array:
{
  provide: BUDGET_ROLE,
  useFactory: () => {
    const auth = inject(Auth);
    return () => auth.currentRole();
  },
},
```

Replace only the two placeholder route entries (do not append another empty path):

```ts
import { budgetsGuard } from './features/budgets/services/budget-access';

{ path: '', pathMatch: 'full',
  loadComponent: () => import('./features/home/pages/home-page').then(m => m.HomePage) },
{ path: 'budgets', canActivate: [budgetsGuard],
  loadComponent: () => import('./features/budgets/pages/budgets-page').then(m => m.BudgetsPage) },
```

The Auth API above was inspected on origin/feature/auth-memberships. The guard redirects unauthorised visits to /login, the component hides content if the role changes, and store methods reject unauthorised writes. These are frontend demonstration checks; they do not provide backend security. Keep the supplied role reader reactive: read the auth signal inside the returned function.

The existing main routes for membership/shop/auth/profile still show ComingSoon. Home links resolve to those registered routes and will show the full features after team integration.

## Kuwaity + Hassib: Shop contract

BudgetStore.replaceShopSales(snapshot: readonly SaleRecord[]) accepts the complete current sales snapshot. It imports the existing shared SaleRecord, without changing it. Connect the actual Shop sales signal/service only after the team agrees on that API. No browser-storage key is assumed and no fictional Shop sale is silently inserted.

Read SaleRecord.total as Shop income, once. Do not add subtotal, subtract discounts a second time, or add staff commissions here. Duplicate sale IDs use the last occurrence in the snapshot. Calling the method repeatedly replaces the snapshot; removed sales disappear. Input is copied and invalid snapshots fail before replacing existing state. The snapshot must contain the complete history needed by the date filter, not just the current shop-page view.

Manual Shop income is rejected by the service, even if a form is bypassed. Imported sales cannot be edited in Budgets. Edit/cancel/refund semantics remain owned by Shop; the current contract supports nonnegative sale totals, not negative refund records. A refund contract needs team agreement before implementation. A source update example, after login:

```ts
// In the agreed integration layer, inside an Angular injection context:
// Use the actual Shop service API once it is agreed.
effect(() => {
  const snapshot = shop.sales();
  if (budgetStore.allowed()) budgetStore.replaceShopSales(snapshot);
});
```

All manual amounts require positive values with at most two decimal places. Type selects income or expense. Dates are valid calendar dates; records are filtered inclusively using YYYY-MM-DD. Sale dates use the first ten characters of the agreed ISO date, without timezone conversion. Balances mean income minus expenses, not business profit. Aggregation uses integer cents; display uses EGP.

## State, styling and open team decisions

The finance store stays in memory for this milestone contribution. Data survives navigation within the current app session and resets on reload. No cookies or browser storage are written by Omar's features. Hassib owns the application-wide storage design: the PDF asks for justified cookies, sessionStorage and localStorage usage across the whole app. Coordinate any finance persistence before adding it.

Feature palette proposal: dark green #193e31, light green #edf3e9, amber expenses and blue balances. Spacing: 8/16/24/32px. Breakpoints: 480 and 800px. Styles are scoped to these pages and use system fonts. Shared navbar responsiveness remains Hassib's responsibility.

The PDF explicitly asks for Angular chart libraries (examples: ngx-charts or Chart.js). This contribution uses Angular-rendered CSS bars with a table alternative to avoid an unapproved package change. Ask Hassib/TA to approve this approach or agree on a chart library before final submission. Bars show absolute balance size, with negative numeric values and a distinct loss color; no profit ratios are invented.

The PDF specifies Jasmine/Karma; the repository uses Vitest. Confirm acceptability with Hassib/TA. No test configuration or dependency files were changed. Those two coursework decisions remain open.

## Demonstration and screenshot checklist

After the route/auth snippets are integrated, run npm ci, npm run build and npm test -- --watch=false. Use the repository's compatible Node version. Check:

1. At 1440px, 768px and 390px, open /. Capture the hero and three information cards. Follow signup, login, membership, shop and profile links. Team features may still be placeholders before merge.
2. Log in with Hassib's fictional accountant account. Open /budgets. Capture cards, department chart and numeric table. Default mock totals: income EGP 22,500, expenses EGP 20,000, balance EGP 2,500. Events has a negative EGP 700 balance. Shop income is zero until a sales snapshot is connected.
3. Add an Events expense, edit its amount, then cancel another edit. Confirm totals change once, and cancellation leaves records unchanged. Try an empty description, zero amount, invalid precision and manual Shop income.
4. Filter Events and a date range; cards, chart and records must agree. Use a future range to show empty data. Try a reversed range and then clear filters.
5. Feed the same SaleRecord snapshot twice through the agreed integration. One sale ID should produce one Shop row. Change its total, refresh the snapshot, then remove it; income should follow each snapshot.
6. Log out or switch to trainee while viewing budgets. Records should disappear; direct /budgets access should redirect. Test an admin too.
7. Use only Tab, Shift+Tab and Enter to follow links, fill the form, save and edit. Check visible focus, labels and announced save/error messages. At phone width, scroll tables within their containers and inspect the chart value table.

For the three-page team report, use a desktop home screenshot, a desktop dashboard screenshot with a negative balance, and a mobile dashboard screenshot. Caption the screenshots with the demo role, viewport and fictional-data note. Describe this feature's signal state and the team's agreed storage choices. Screenshots must be captured after integration; none are presented here as verified UI captures.

## Suggested review summary

Adds Omar's public homepage and department budget features without modifying the shared shell. The budget view supports validated income/expense records, filters and accessible summaries. Shop revenue has one source of truth through a replaceable SaleRecord snapshot; manual Shop income is blocked. Hassib needs to connect the supplied lazy routes and reactive auth provider, and coordinate the Shop adapter before merging.
