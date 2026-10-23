# FinanzPartner — financing experience

German-language Next.js 16 App Router starter for an illustrative loan calculator and non-binding financing inquiry.

## Run locally

```sh
npm install
npm run dev
```

Open `http://localhost:3000`. URL parameters such as `?amount=5000&term=36&utm_source=tiktok` prefill the calculator. The `amount` and `term` values are validated against the available ranges. `src/lib/loan.ts` contains the typed annuity calculation and German currency formatter.

## Application API setup

Copy `.env.example` to `.env.local`. Configure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to enable secure server-side persistence. The API intentionally returns `503` if storage is not configured; it never pretends that a demo request was received. Create a Supabase `applications` table with columns matching the application object in `src/app/api/applications/route.ts`. Never expose the service-role key to browser code.

Set `RESEND_API_KEY` and `EMAIL_FROM` to send an optional applicant confirmation. The UI reports whether the confirmation email was actually sent. Configure and verify the sender domain with Resend before enabling delivery. The API validates consent, allowed purposes, numeric ranges, same-origin browser requests, JSON content type and request size; it does not log submitted personal data.

## Checks

`npm run lint` runs TypeScript validation. `npm run build` creates the production build. `npm audit` should report no known dependency vulnerabilities.

## Important before production

This starter is not a lender, broker, credit offer, compliance certification or legal advice. Sample interest rates and the 0% promotion are illustrative and must not be presented as available or approved terms without verification and legally reviewed representative examples. No secure document-upload workflow, approval, express payout or actual credit decision is implemented. The form deliberately does not collect IBAN, identity documents or payroll records.

Replace all legal placeholders with real company information and reviewed German disclosures. Verify actual licensing and applicable PAngV, consumer-credit, DSGVO, cookie, consent, security and advertising requirements with qualified counsel. The cookie interface stores only a local preference; no advertising or analytics scripts are enabled. No BaFin, SSL or press endorsements are claimed. Configure production-grade rate limiting, bot protection, retention/deletion policies, monitoring and operational recovery before accepting public submissions. Validate real pricing and all financial representations before launch.

## Preview access

The in-sandbox site should be opened via Arena's **Live Preview** control. A direct `e2b.app` address can return `403 Missing traffic access token` because the preview gateway requires its traffic-access header. That gateway authorization is not handled by this Next.js app; do not hard-code or expose a traffic token in the repository or browser URL.
