# Operator to-do

Things only the operator can do. The app runs without them, with the fallback noted.

## Needed now

| # | What | Why | Until then |
|---|------|-----|------------|
| 1 | Set `TURSO_API_TOKEN` and `TURSO_ORG` in Vercel (Production + Preview). Use the Turso org that holds the central DB (created through the Vercel Turso integration, region `aws-ap-south-1`). | Family databases are created per family through the Turso Platform API. | Parents can sign up, but the parent area shows "Your family space is not ready yet". |
| 2 | Add a credit card to the Vercel team's AI Gateway (Vercel dashboard > AI Gateway). Then set a low monthly budget there. | AI Gateway refuses all requests, even the free Nemotron model, with `customer_verification_required`. | Whyzy answers every question with a safe fixed reply ("Hmm, let's talk about something else…"). |
| 3 | Choose the moderation model (SPEC open item). Candidate: `openai/gpt-oss-safeguard-20b` on AI Gateway. Set `MODERATION_MODEL` in Vercel, then run `npm run redteam:live`. | Second check on every reply. | Rule-based output moderation only (English and Hindi keyword rules). |
| 4 | Choose the parent alert channel for distress (email, SMS or push) and share SMTP details. | FR-16 immediate parent alert. | Alerts show at the top of the parent area and on the Safety alerts page only. |
| 5 | Native Hindi speaker to review the Hindi red-team cases and keyword lists (`tests/redteam/cases.json`, `src/lib/safety/rules.ts`). | REQUIREMENTS open question 12. | Hindi rules were written without native review. |
| 6 | ElevenLabs: recheck terms (they bar under-18 users), turn on the training opt-out (Terms and Privacy > Data use), then set `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` in Vercel. Or decide to stay on the fallback. | Server-side TTS (FR-23). | Replies are spoken by the browser's on-device voice (local voices only); if the device has none, text only. |
| 7 | Test on-device speech on the children's real devices (Chrome 139+ desktop), especially Hindi. | `processLocally` support is limited and Hindi is unverified (REQUIREMENTS open questions 1–2). | The child can type; the app never falls back to cloud speech recognition. |
| 8 | Confirm each chosen Petdex pet's licence, or get written permission from Crafter Station. The petdex README says assets belong to their submitters under whatever licence each declares; per-pet licences could not be confirmed from here. Then add sprites as described in `public/pets/README.md`. | FR-24. | Each pet is drawn by the app's own built-in avatar (pet colour + emoji, animated per state). |
