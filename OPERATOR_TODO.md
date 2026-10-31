# Operator to-do

Things only the operator can do. The app runs without them, with the fallback noted.

## Needed now

| # | What | Why | Until then |
|---|------|-----|------------|
| 1 | Set `TURSO_API_TOKEN` and `TURSO_ORG` in Vercel (Production + Preview). Use the Turso org that holds the central DB (created through the Vercel Turso integration, region `aws-ap-south-1`). | Family databases are created per family through the Turso Platform API. | Parents can sign up, but the parent area shows "Your family space is not ready yet". |
