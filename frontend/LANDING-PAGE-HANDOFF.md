# TargetIQ Landing Page Update

This ZIP replaces `app/landing/page.tsx` with a production-oriented marketing page for the positioning:

> Turn LinkedIn into a Lead Generation Machine

## Included
- Bilingual EN/AR copy using existing `LanguageContext`
- TargetIQ brand colors via existing Tailwind tokens
- Hero section with clear CTA
- Workflow: Collect → Enrich → Convert
- Features section
- Use cases for recruitment, sales, agencies, SaaS
- Launch pricing section
- Chrome Web Store CTA using existing `CHROME_STORE_URL`

## Test locally

```bash
npm ci
npm run typecheck
npm run build
npm run dev
```

Open:

```txt
http://localhost:3000/landing
```
