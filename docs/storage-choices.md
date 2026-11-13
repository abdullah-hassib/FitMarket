# Milestone 1 — browser storage choices

FitMarket is a frontend-only coursework prototype; it must not collect real card data or be considered a secure authentication/payment system.

- **Cookie**: `fitmarket_compact_view` stores an explicitly user-selected display density (`1` compact, `0` comfortable), for up to 30 days. It uses `SameSite=Lax`, `Path=/`, and `Secure` on HTTPS. The user can toggle the preference in the site header, and it is restored when the application is reopened. No tracking or sensitive content is stored in this cookie.
- **sessionStorage**: `fitmarket_session_user_id_v1` stores the numeric ID of the signed-in mock account. It is specific to a browser tab/session and is not a real security boundary. It deliberately does not store a password.
- **localStorage**: demo registered accounts (salted password verifiers), product inventory, carts, completed purchase records, membership subscriptions, invoices/payments and manually entered budget records persist across reloads on the same browser. Never enter real payment details.

Privacy/security tradeoff: JavaScript-readable localStorage, sessionStorage and cookies are vulnerable to malicious scripts; access control and payment settlement in a production app require a trusted backend and secure server-managed sessions.

UX tradeoff: local persistence avoids losing simulated purchases and financial records on refresh. The session-specific sign-in expires when that tab session ends; the visual preference survives for 30 days.
