# Operator to-do

Things only the operator can do. The app runs without them, with the fallback noted.

## Needed now

| # | What | Why | Until then |
|---|------|-----|------------|
| 1 | Set `TURSO_API_TOKEN` and `TURSO_ORG` in Vercel (Production + Preview). Use the Turso org that holds the central DB (created through the Vercel Turso integration, region `aws-ap-south-1`). | Family databases are created per family through the Turso Platform API. | Parents can sign up, but the parent area shows "Your family space is not ready yet". |
| 2 | Add a credit card to the Vercel team's AI Gateway (Vercel dashboard > AI Gateway). Then set a low monthly budget there. | AI Gateway refuses all requests, even the free Nemotron model, with `customer_verification_required`. | Whyzy answers every question with a safe fixed reply ("Hmm, let's talk about something else…"). |
