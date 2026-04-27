# TargetIQ Frontend

This is the Next.js frontend for TargetIQ, now organized in a monorepo structure.

## How to run the smoke checklist

1. Start the API
	- `pnpm -C targetiq-api start:dev`

2. Start the web app
	- `pnpm -C targetiq-web dev`

3. Verify status handling (web)
	- Baseline: log in and confirm the dashboard loads and `/credits` returns successfully.
	- `401` (login required): remove the stored token (or log out) and try a credit-consuming action; confirm actions are blocked and you’re prompted to sign in.
	- `402` (upgrade required): use an account with exhausted monthly credits; confirm actions are blocked with an upgrade-required message.
	- `429` (daily cap): exceed the daily cap; confirm actions are blocked until reset.
	- `5xx`/network: stop the API temporarily and try a credit-consuming action; confirm a retryable server error message (no infinite retry loops).

4. Extension ingest checks (bounded retries)
	- Build the extension: `pnpm -C targetiq-extension build`
	- Load unpacked from `targetiq-extension/dist`.
	- With the API stopped (network/5xx), trigger “Send to Server” and confirm it retries at most 3 times.
	- For `401/402/429`, confirm it does not retry and immediately shows the corresponding status message.

5. Production build sanity
	- `pnpm -C targetiq-web build`
	- `pnpm -C targetiq-extension build`
	- Confirm the Diagnostics panels are not visible in production builds.
