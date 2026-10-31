# Operator to-do

Things only the operator can do. The app runs without them, with the fallback noted.

## Needed now

| # | What | Why | Until then |
|---|------|-----|------------|
| 0 | Check the Vercel Turso integration's per-deployment database branching (it applies to both the central and the content store). Branch databases may count toward the 100-database Starter limit. Also, if the integration rotates the stores' tokens, copy the new values into `CENTRAL_DB_*` and `CONTENT_DB_*`. Original note: Each deployment gets its own branch DB (`dpl-…`) in `TURSO_DATABASE_URL`, so production data reset on every deploy. Claude set `CENTRAL_DB_URL` and `CENTRAL_DB_TOKEN` (Production only) to the main DB as a fix. If you turn branching off for Production, you can delete those two variables. | Keep parent accounts and access keys across deploys. | Fixed by the override; nothing else needed. |
| 1 | Set `TURSO_API_TOKEN` and `TURSO_ORG` in Vercel (Production + Preview). Use the Turso org that holds the central DB (created through the Vercel Turso integration, region `aws-ap-south-1`; open it from Vercel > Storage > Turso > Open in Turso, then create a Platform API token in Turso settings). Claude cannot create this token with the Vercel token: Vercel only provisions databases, not Turso API tokens. | Family databases are created per family through the Turso Platform API. | Parents can sign up, but the parent area shows "Your family space is not ready yet". |
| 1a | Done by Claude: content DB `whyzy-content` created through the Vercel Turso integration (Mumbai, `bom1`), connected to the project (vars `CONTENTSTORE_TURSO_*`), copied to `CONTENT_DB_URL` / `CONTENT_DB_TOKEN` (Production, Preview), migrated, 27 seed drafts loaded. | — | — |
| 1b | After 2: seed drafts are already loaded; run `npm run content:validate` with `CONTENT_VALIDATOR_MODEL` set (e.g. `openai/gpt-oss-safeguard-20b`). Then grow the library with `npm run content:generate -- <module> <collection> <age-band> <count>`. | Publishes the 27 seed items (all 12 modules) and new content. | Seed items stay drafts; children see no cards. |
| 2 | Add a credit card to the Vercel team's AI Gateway (Vercel dashboard > AI Gateway). Then set a low monthly budget there. | AI Gateway refuses all requests, even the free Nemotron model, with `customer_verification_required`. | Whyzy answers every question with a safe fixed reply ("Hmm, let's talk about something else…"). |
| 3 | Choose the moderation model (SPEC open item). Candidate: `openai/gpt-oss-safeguard-20b` on AI Gateway. Set `MODERATION_MODEL` in Vercel, then run `npm run redteam:live`. | Second check on every reply. | Rule-based output moderation only (English and Hindi keyword rules). |
| 4 | Choose the parent alert channel for distress (email, SMS or push) and share SMTP details. | FR-16 immediate parent alert. | Alerts show at the top of the parent area and on the Safety alerts page only. |
| 5 | Native Hindi speaker to review the Hindi red-team cases and keyword lists (`tests/redteam/cases.json`, `src/lib/safety/rules.ts`). | REQUIREMENTS open question 12. | Hindi rules were written without native review. |
| 6a | After 6: run `npm run content:narrate` once (validate and generate also run it) so every published card has stored narration. | Narration made once and stored (Phase 11). | Cards are read by the browser's on-device voice; if the device has none, the text is shown. |
| 6 | ElevenLabs: recheck terms (they bar under-18 users), turn on the training opt-out (Terms and Privacy > Data use), then set `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` in Vercel. Or decide to stay on the fallback. | Server-side TTS (FR-23). | Replies are spoken by the browser's on-device voice (local voices only); if the device has none, text only. |
| 7 | Test on-device speech on the children's real devices (Chrome 139+ desktop), especially Hindi. | `processLocally` support is limited and Hindi is unverified (REQUIREMENTS open questions 1–2). | The child can type; the app never falls back to cloud speech recognition. |
| 8a | Card artwork: the Figma file's sample book covers (snowman, samurai, robots, mermaid, etc.) were not copied; their licence is unclear and they are placeholder art. Cards use module colours and emoji. Supply licensed or commissioned illustrations if you want picture covers. | Look of cards. | Gradient covers with emoji. |
| 8 | Confirm each chosen Petdex pet's licence, or get written permission from Crafter Station. The petdex README says assets belong to their submitters under whatever licence each declares; per-pet licences could not be confirmed from here. Then add sprites as described in `public/pets/README.md`. | FR-24. | Each pet is drawn by the app's own built-in avatar (pet colour + emoji, animated per state). |

## Before the pilot opens

| # | What |
|---|------|
| 9 | Choose the pilot model (SPEC default candidate: Claude via AI Gateway, e.g. `anthropic/claude-haiku-5.5`). Run `npm run redteam:live` with it; all cases must pass. |
| 10 | In Vercel set `WHYZY_MODEL=<pilot model>` and `WHYZY_STAGE=pilot`, then redeploy. Pilot stage refuses free models and forces `disallowPromptTraining` and `zeroDataRetention` (ZDR needs a Vercel Pro or Enterprise team). |
| 11 | Set a monthly AI Gateway budget cap. |
| 12 | Draft the parent consent form and privacy notice; collect written consent from each family. The in-app consent screen only records that the parent says they signed it. |
| 13 | Manual red-team round with no open findings (REQUIREMENTS pilot gate). |
| 14 | Password reset email: share SMTP details (FR-02a). Until then a parent who forgets the password needs the operator. |
| 15 | Name clearance: domain, app-store name, IP India trademark search. |
| 16 | Parent survey tool and targets (FR-30). |

## Already done by Claude

- `CENTRAL_DB_URL`, `CENTRAL_DB_TOKEN` (Production): main central DB, see item 0.
- `AUTH_SECRET`, `CRON_SECRET`, `NEXT_TELEMETRY_DISABLED`, `WHYZY_MODEL`, `WHYZY_STAGE=test` set in Vercel.
- Vercel project framework set to Next.js; function region `bom1`.
- Central DB migrated (Mumbai).

## Test data left in the main central DB

Cleanup was blocked by a permission check, so please remove these yourself (all made-up):

- One test parent with an `@example.test` email (`smoke…@example.test`).
- Several unused test access keys with a 1-day expiry (they expire on 1 Nov 2026 and cannot be used after that).
