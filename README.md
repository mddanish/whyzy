# Whyzy

Safe, voice-first AI helper for children. Invite-only pilot. See `SPEC.md` and `REQUIREMENTS.md`.

## Setup

1. `npm install`
2. Fill `.env.local` (template: `.env.example`): `TURSO_API_TOKEN`, `TURSO_ORG`, `AUTH_SECRET`, `VERCEL_TOKEN`.
3. `npm run turso:setup`: creates the `whyzy-central` database in Mumbai (skip if `TURSO_DATABASE_URL` is already set).
4. `npm run db:migrate`
5. `npm run keys:create -- 1 30`: one access key, valid 30 days.
6. `npm run dev` and open http://localhost:3000/signup

For local development without Turso Platform API access, set `FAMILY_DB_LOCAL_DIR=.data/families` to keep family databases as local files.

## Tests

`npm test` runs unit tests and the red-team safety suite against temporary local databases. It also runs in CI and in every Vercel build, so an unsafe reply blocks a deploy. `npm run redteam:live` runs the red-team set against the real model.

## Operator

See `OPERATOR_TODO.md` for what only the operator can do, and `docs/DATA_HYGIENE.md` for the data hygiene checklist.
