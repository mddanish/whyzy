@AGENTS.md

# Whyzy

Voice-first, safe AI assistant for children aged 4+. Invite-only pilot.

- Product spec: `SPEC.md`. Requirements: `REQUIREMENTS.md`. Read both before changing behaviour.
- Build in the seven phases in `SPEC.md`, one phase per session. Commit and deploy at the end of each phase.
- Never use real children's data during build or test. Use made-up data only.

## Decisions that differ from SPEC.md

- Login is email and password (Auth.js Credentials, JWT sessions) for now. OAuth (Google) comes later. The Drizzle adapter and its tables are already there for that.
- Password reset by SMTP email comes later. The operator will share the email service details.
- Replies are always in English. A child profile sets the input language (English or Hindi).

## Data hygiene rules (always)

- Never log prompts, replies, names, emails or other personal details. Log IDs and event types only.
- No analytics, no telemetry (`NEXT_TELEMETRY_DISABLED=1`), no ads, no behavioural tracking.
- Vercel Functions run in `bom1` (`vercel.json`). Turso databases must be in Mumbai (`aws-ap-south-1`).
- Secrets live in `.env.local` (git-ignored) and Vercel environment variables. Never commit them.
- Access keys are stored as SHA-256 hashes only.

## Commands

- `npm run dev` / `npm run build` / `npm test` / `npm run typecheck` / `npm run lint`
- `npm run turso:setup`: create the central DB in Mumbai, write its URL and token to `.env.local`
- `npm run db:generate`: create a migration after editing `src/db/central/schema.ts`
- `npm run db:migrate`: apply migrations to the central DB
- `npm run keys:create -- <count> <days>`: create pilot access keys (printed once)

## Layout

- `src/auth.ts`: Auth.js config. `src/lib/dal.ts`: session check (call inside `<Suspense>`; Cache Components are on).
- `src/db/central/`: central DB schema and client. `drizzle/central/`: migrations.
- `src/lib/access-keys.ts`: invite keys and parent registration (one transaction).
- `src/lib/turso-platform.ts`: Turso Platform API (setup and family DBs).
- `src/db/family/`: family DB schema. `drizzle/family/`: its migrations, applied when a family DB is opened.
- `src/lib/family-db.ts`, `src/lib/family.ts`: create, open and drop family DBs; account deletion.
- `src/lib/child-mode.ts`: signed child-mode cookie; parent area needs the PIN while it is set.
- `FAMILY_DB_LOCAL_DIR`: local SQLite family DBs for development and tests only.
- `OPERATOR_TODO.md`: things only the operator can do.
