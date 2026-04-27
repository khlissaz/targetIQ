# TargetIQ Pricing API + Landing Translation Handoff

## API endpoints verified
- `GET /billing/pricing?currency=USD|SAR&lang=en|ar&billingInterval=MONTHLY|YEARLY`
  - Source of truth for public plans, prices, features, limits, team capacity, badges, and checkout state.
- `POST /billing/checkout-session`
  - Authenticated + business-scoped checkout.
  - Payload used by the web app: `{ planCode, currency, billingInterval }`.
- `GET /billing/subscription-summary`
  - Used to detect the current authenticated user's active plan.
- `GET /billing/onboarding-summary`
  - Used by onboarding readiness.

## Important API findings
- Public pricing should use `/billing/pricing`, not legacy `/pricing`.
- Checkout depends on a real Stripe price ID configured in either `pricing_prices.stripePriceId` or `STRIPE_PRICE_<PLAN>_<CURRENCY>_<INTERVAL>`.
- If a paid plan has `checkoutEnabled=true` but no real Stripe price ID, checkout will fail by design.
- Free plans do not need Stripe checkout and route to onboarding.
- Enterprise/custom plans route to sales instead of checkout.

## Web changes
- Landing pricing cards are now API-driven through `PublicPricingSection`.
- Pricing cards display API data: name, subtitle, description, badge, price, currency, billing interval, monthly capture, monthly enrich, daily caps, team limits, and features.
- Authenticated users stay in the purchase/onboarding flow; guests go to signup with the selected plan preserved.
- Landing page Arabic copy was rewritten professionally and consistently.
- Pricing page explanatory cards are translated through locale files.

## Purchase flow
- Guest + any plan → `/auth/signup?plan=<PLAN>&next=/onboarding?plan=<PLAN>`
- Authenticated + free plan → `/onboarding?plan=<PLAN>`
- Authenticated + paid self-serve plan → active business ensured → Stripe checkout session
- Authenticated + enterprise/custom or unavailable checkout → contact sales
