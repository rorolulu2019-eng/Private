# FinanzPartner — financing experience

German-language Next.js 14 App Router starter for a loan-orientation calculator and an explicitly non-binding inquiry workflow.

## Run locally

```sh
npm install
npm run dev
```

Open http://localhost:3000. URL parameters `?amount=5000&term=36&utm_source=tiktok` prefill the calculator; campaign parameters are not persisted. `src/lib/loan.ts` contains the typed annuity engine and German currency formatter.

## Optional application integrations

Copy `.env.example` to `.env.local` and configure server-side values only. The API stores applications in Supabase when both `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are present, and sends a confirmation email when `RESEND_API_KEY` and `EMAIL_FROM` are set. Otherwise, it returns a successful demo response and logs only a limited diagnostic record; no durable storage or email delivery is available. Create a Supabase `applications` table with columns matching `src/app/api/applications/route.ts` before enabling storage. Use a restricted service role key, rate limiting, bot protection, retention controls, consent logging and monitoring before public launch.

## Before production

This repository is a design/engineering starter, not a live lender, broker, credit offer, compliance certification or legal advice. The illustrative 2.20% rate and 0% promotion are sample UI assumptions and must not be represented as available/approved terms without verification and legally reviewed representative examples. Do not use the sample confirmation flow as an approval, express payout, document-upload or loan-contract workflow. The UI deliberately avoids collecting IBAN or identity/payroll documents. No secure document-upload link is generated.

Replace all footer legal placeholders with the actual entity and reviewed German legal disclosures; verify the applicable licensing/permissions and PAngV, consumer-credit, DSGVO, cookie, email-consent, security and advertising requirements with qualified counsel. Current cookie interface records a preference locally but no advertising/analytics scripts are enabled. No BaFin, SSL or press endorsements are claimed. Add consent-aware analytics only after proper consent, server-side schema validation, CSRF/origin controls, rate limiting, anti-abuse protections, operational email failure handling and data-retention/deletion processes. Test any live pricing end-to-end before publishing.
