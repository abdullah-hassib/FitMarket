# FitMarket — 2-Minute Walkthrough Video Script

**Target length:** 1:50 – 2:00

1. **0:00 – 0:20 | Intro & Auth (Hassib's module)**
   - Show login page, sign in as `accountant` (or `admin`).
   - Briefly show role-based navigation in the navbar.

2. **0:20 – 0:50 | User Profile CRUD (Abdelrahman)**
   - Navigate to `/profile`.
   - Click **Edit Profile**, update name, phone, fitness goal, and preferences; click **Save Changes** (show success toast).
   - Refresh the browser page to prove persistence, then show validation error (`422`) on invalid input and **Delete Profile** + **Create Profile**.

3. **0:50 – 1:25 | Database-Backed Payroll & JSON Export (Abdelrahman)**
   - Navigate to `/payroll`.
   - Update an employee's allowances/deductions and commission rate; show live net-salary recalculation.
   - Click **Save monthly payroll** and **Export monthly JSON**, briefly opening the downloaded JSON to show it matches the displayed table.
   - Switch to a `trainee` account and show `/payroll` access is blocked (`403` / route guard).

4. **1:25 – 1:45 | Shop & Budgets Highlights (Mohamed & Omar)**
   - Briefly show `/shop` checkout/order history and `/budgets` chart + LogRocket performance highlight.

5. **1:45 – 2:00 | Test Proof & Wrap-up**
   - Show terminal output of `npm run test:vitest` (36 files / 118 tests passing) and `php artisan test` passing.
