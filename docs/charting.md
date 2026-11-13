# Department budgets — Chart.js integration

The previous CSS bars were replaced with Chart.js 4.6.1 using Angular's standalone BudgetChart component. Chart.js is dynamically imported only when the chart canvas is available, preserving route lazy-loading. The chart tracks Angular Signals via the `summaries()` input and updates when the department or date range changes.

The three grouped series are income, expenses and signed balance, in EGP. Negative balances extend below zero. The accessible budget table beneath the canvas remains the authoritative readable alternative and supports keyboard/screen-reader use. Data still originates from the reactive BudgetStore: finalized Shop sales, paid membership invoices and saved manual income/expense entries. Unpaid invoices and payroll expenses are not automatically booked.

Automated checks include budget calculation/filters and a chart-series mapping test. The production bundle and mobile layout still require visual verification.
