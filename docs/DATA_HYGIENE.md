# Data hygiene checklist

From SPEC.md. Status as of the Phase 7 build. "Code" means enforced in this repo; "Operator" means it needs an action listed in `OPERATOR_TODO.md`.

| Item | Status | Where |
|------|--------|-------|
| Vercel Functions region set to Mumbai (`bom1`) | Done | `vercel.json` `regions`, project setting `serverlessFunctionRegion` |
| Turso databases in AWS Mumbai (`ap-south-1`), no replicas outside India | Central DB: done (`aws-ap-south-1`). Family DBs: code refuses any non-Mumbai group | `src/lib/turso-platform.ts` `ensureMumbaiGroup` |
| Prompt and reply content never written to Vercel logs | Done: logs carry IDs and event types only; the AI SDK's default error logging is off | `src/lib/chat/*`, `src/app/api/*`, `src/auth.ts` logger |
| No analytics, CopilotKit or SDK telemetry | Done: none installed; `NEXT_TELEMETRY_DISABLED=1` in Vercel and CI | `package.json`, Vercel env |
| AI Gateway `disallowPromptTraining: true`; `zeroDataRetention: true` for the pilot | Code: forced when `WHYZY_STAGE=pilot`, and free models are refused. Operator: switch stage and model | `src/lib/ai/model.ts` |
| ElevenLabs training opt-out on; calls server-side only | Code: server-side only, signed replies only, names removed. Operator: opt-out and keys | `src/lib/voice/tts.ts`, `src/app/api/tts/route.ts` |
| Browser STT with `processLocally = true`; no cloud fallback | Done: standard API only, webkit (cloud) path never used | `src/lib/voice/speech.ts` |
| No audio stored anywhere | Done: no audio is written to any database or file; TTS audio is streamed with `no-store` | — |
| Chat logs optional per family, auto-deleted after the retention period | Done: off by default; turning off deletes saved logs; daily retention job | `src/lib/retention.ts`, `src/app/api/cron/retention/route.ts`, `vercel.json` `crons` |
| Secrets in Vercel environment variables only | Done: `.env*` git-ignored; secrets set through the Vercel API | `.gitignore` |
| Account deletion drops the family DB and central rows; tested | Done | `src/lib/family.ts`, `tests/family.test.ts` |
| Access keys stored hashed; expiry set | Done | `src/lib/access-keys.ts`, `tests/access-keys.test.ts` |

Other protections:

- Personal details are stripped before text reaches the model, TTS or the chat log.
- The child's own name is never sent to the model or TTS.
- Retention also removes daily usage rows after 30 days and seen alerts after 90 days.
- Security headers: no referrer, no framing, no camera or location.
