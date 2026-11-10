# FitMarket — Memberships (Milestone 1)

## Scope

Frontend-only membership selection for the FitMarket gym academy, using fictional plans and simulated subscriptions. This is a mock workflow, **not** a real subscription, authorization, or payment system.

## Feature structure

- `src/app/features/memberships/models/membership.model.ts` — `MembershipPlan`, `MembershipStatus`, and `MembershipSubscription`.
- `src/app/features/memberships/services/membership.service.ts` — available plans, subscriptions Signal, persistence, and subscription methods.
- `src/app/features/memberships/pages/memberships-page/` — plan cards, request action, and per-user history.
- `src/app/app.routes.ts` — `/memberships` should lazy-load `MembershipsPage`.

These paths describe the intended feature structure. Verify the implementation and successful build before merging.

## Data model

A **plan** describes an offer: `id`, `name`, `priceEGP`, `durationMonths`, and `benefits`.

A **subscription** records a user's selection: `id`, `userId` (the existing `User.id`), `planId`, `status`, `createdAt`, and optional `startDate`/`endDate`.

Subscription statuses: `pending`, `active`, `expired`, `cancelled`. The planned UI currently requests *pending* subscriptions; it does not independently implement cancellation or automatic expiration.

### Example mock plans

| Plan | Duration | Price (EGP) |
| --- | ---: | ---: |
| Basic | 1 month | 500 |
| Standard | 3 months | 1,200 |
| Premium | 12 months | 4,000 |

Prices are fictional demo data, not real offers.

## Workflow

1. A visitor can browse plans; a signed-out visitor is sent to login before subscribing.
2. A logged-in **trainee** requests a plan. The page uses `Auth.currentUser()` to identify the current user.
3. `MembershipService.requestSubscription(userId, planId)` creates a `pending` subscription unless that user already has a `pending` or `active` one.
4. The page displays the user's subscription history and current status.
5. **Future Student Fees integration:** an authorized, successful **simulated** invoice payment will call `activateSubscription(subscriptionId)`, changing the subscription to `active` and assigning start/end dates.

Do not activate a membership merely because the trainee clicked **Request Membership**. The invoice/payment flow is responsible for that transition.

## State, storage, and integration contract

- Angular `signal()` / `computed()` provide reactive updates.
- The proposed storage key is `fitmarket_memberships_v1` in `localStorage`. This survives refreshes and browser restarts in the same browser profile; it is **not** shared with other devices.
- `MembershipService.plans`: plans available for display.
- `MembershipService.subscriptions()`: subscription records.
- `getPlan(planId)`: plan lookup.
- `getUserSubscriptions(userId)`: filter subscriptions for a user.
- `requestSubscription(userId, planId)`: request a plan, returning a subscription or `null`.
- `activateSubscription(subscriptionId)`: activate an eligible pending subscription, returning a boolean.

**Student Fees module:** use a stable `subscriptionId` on the invoice so a simulated successful payment can activate exactly that membership. Ensure the invoice belongs to the intended user; avoid creating duplicate invoices for a single subscription.

## Known limitations

- All data is demo data stored in the browser. Users can modify localStorage; client-only role checks are not real authorization.
- No real backend, card processing, or payment gateway.
- Expiry and cancellation statuses are modeled, but automatic lifecycle transitions are not yet implemented.
- Verify date handling near month-end boundaries.
- The UI-level trainee rule is not a security boundary; a backend would need to enforce it in a real system.

## Manual verification checklist

- [ ] `npm run build` passes.
- [ ] `/memberships` displays all three plans and benefits.
- [ ] Signed-out visitors see login navigation.
- [ ] A signed-in trainee can request a plan.
- [ ] History shows the new subscription as **pending**.
- [ ] Duplicate pending/active subscriptions are blocked for one user.
- [ ] Data remains after refreshing the page.
- [ ] A different user cannot see the trainee's history in the UI.
- [ ] Admin/accountant accounts cannot request trainee subscriptions through the page.
- [ ] After Student Fees integration, only simulated successful payment activates the matching subscription.

## Next implementation task

Build **Student Fees & Invoices**: invoice models, per-user invoice lists, controlled invoice creation, mock payment, payment history, and linkage to `activateSubscription(subscriptionId)`.
