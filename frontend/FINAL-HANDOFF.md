# Final Handoff Notes

## Scope
This package contains the latest working project snapshot with the following targeted improvements:
- unified credits snapshot semantics in web/API
- clearer leads credits UI labels and grouped actions
- persistent/collapsible/resizable dashboard sidebar in web
- existing outreach/campaign/template/sequence modules preserved

## Important notes
- Run migrations before starting the API.
- Review and test campaign orchestration flows after setup.
- Sidebar width is persisted in localStorage.
- Credits UI now shows remaining/limit/used/reset instead of ambiguous values.

## Recommended verification
1. API: `pnpm install && pnpm migration:run && pnpm start`
2. Web: `pnpm install && pnpm dev`
3. Extension: `pnpm install && pnpm build`

## Manual smoke tests
- Leads page loads and credits cards display labels.
- Credits resetAt renders correctly.
- Sidebar collapse/expand and width controls persist on refresh.
- Outreach prospects list loads.
- Campaigns, templates, sequences pages load.
