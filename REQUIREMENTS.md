# Whyzy AI — Requirements Document

**Version**: 1.0
**Date**: 2026-10-31
**Status**: Draft
**Source**: Whyzy AI — Build Spec (Oct 31, 2026), plus discovery answers

---

## 1. Project Overview

Whyzy is a voice-first, safe AI companion for children aged 4 and up. Its main experience is a library of pre-written, safety-checked content cards that children listen to; free chat is optional and parent-controlled. Children may speak English or Hindi; Whyzy always replies in English. It runs on Vercel and the AI SDK, with data in Mumbai and speech recognition on the device. It is built first as a closed test, then as an invite-only pilot of up to 20 families within 3 months.

## 2. Goals & Success Criteria

- Goal 1: Every reply a child hears is safe for their age band.
- Goal 2: Store as little about the child as possible; nothing is learned automatically.
- Goal 3: Parents stay in control of profiles, limits, logs and deletion.

**Pilot is ready to open when:**

- Red-team test suite passes 100% for English and Hindi inputs, in CI, against the pilot model.
- Manual red-team round completed with no open findings.

**Pilot is successful when:**

- Zero unsafe replies reach a child during the pilot.
- Parent satisfaction meets the agreed survey target (target value TBD).
- Child engagement, as reported by parents in the survey, meets the agreed target (no in-app tracking).
- Median time from child releasing the talk button to reply audio starting is under 3 seconds.

## 3. Users & Stakeholders

| Role | Description |
|------|-------------|
| Parent | Only account holder. Signs in, gives consent, manages child profiles, settings, logs, alerts and deletion. |
| Child | Profile under a parent. Picks avatar, pushes to talk, hears replies. No account, no settings. |
| Builder / tester | Builds and tests with made-up data only during test phase. |
| Operator (Data Fiduciary) | Runs the hosted service; owns compliance, invite keys and safety review. |

## 4. Functional Requirements

### Must Have (Pilot)

**Access and auth**
- FR-01: Parents sign up with a valid, unexpired invite access key (stored hashed).
- FR-02: Parents sign in with email and password (Auth.js Credentials, Drizzle adapter, `central` Turso DB). Google and other OAuth providers come later.
- FR-02a: Password reset by email over SMTP (details pending from operator).
- FR-03: Written parental consent is recorded before a child's first use.
- FR-04: A parent PIN locks the way from child mode back to parent mode.

**Families and profiles**
- FR-05: A family Turso DB is created in Mumbai on sign-up.
- FR-06: Parents add, edit and delete child profiles: display name, age band (4–6, 7–9, 10–12, 13+), interests, avatar pet, input language (English or Hindi).
- FR-07: Parents delete the whole account; this drops the family DB and the parent's `central` rows.

**Parental controls**
- FR-08: Parents toggle chat logging per family and set retention days.
- FR-09: Logs are auto-deleted after retention days.
- FR-10: Parents set a daily time limit per child; child sees a wind-down message when reached.
- FR-11: Parents read chat logs (if on) and safety alerts.

**Chat and safety**
- FR-12: Every message passes input filter, age-band system prompt, and output moderation.
- FR-13: Input filter handles English and Hindi input, strips personal details and classifies intent (allowed, off-limits, distress, jailbreak).
- FR-13a: Replies are always in English, even when the child speaks Hindi.
- FR-14: Off-limits or jailbreak input gets a fixed, gentle redirect with no model call.
- FR-15: Failed moderation replaces the reply with a safe fallback and logs a safety event.
- FR-16: Distress signals get a calm reply pointing to a trusted grown-up, an immediate parent alert and a safety event. No probing questions.
- FR-17: Whyzy always says it is a computer helper, never a person, using the fixed English lines.
- FR-18: Replies use structured output (text + optional picture keyword).
- FR-19: Model name is set in one environment variable.

**Voice**
- FR-20: Push-to-talk speech recognition with `processLocally = true`, in the profile's input language.
- FR-21: Parent setup checks and installs the on-device language model for each profile's input language.
- FR-22: If on-device recognition is unavailable, show a message; never fall back to the cloud.
- FR-23: Reply text (names and identifying details removed) is sent to TTS from the server only, in English.

**Avatar and child UI**
- FR-24: Child picks an approved, licence-checked Petdex pet; sprites are self-hosted.
- FR-25: Pet animation states map to idle, listening, thinking, speaking, happy and wind-down.
- FR-26: Child mode has large buttons, no links out, no settings and no account details.
- FR-27: AI disclosure is shown to parents (pop-up) and spoken or shown to children.

**Testing**
- FR-28: Versioned red-team test set (all spec categories, age-band variants, English and Hindi inputs, English replies) runs in CI and before each deploy; build fails on any unsafe reply.
- FR-29: Every real pilot safety event becomes a new anonymised test case.

**Feedback**
- FR-30: Parent survey covering satisfaction and child engagement, run during and at the end of the pilot.

**Content cards and modules (v2)**
- FR-60: The main child experience is a card library: module → collection → content card (with optional parts).
- FR-61: Modules include Stories, Poems, Nursery rhymes, and Good things and bad things; further modules are added from the proposed list in SPEC.md once the operator accepts them.
- FR-62: Content lives in a separate `content` Turso database in Mumbai. Children only receive items with status `published`.
- FR-63: Each module has a versioned `AGENT.md` and `SKILL.md` used to generate its content; a shared validator agent checks safety.
- FR-64: Content generation is operator-only, in batches. Nothing is generated while a child uses the app.
- FR-65: Every new item passes rule-based moderation and a separate LLM safety validation before it can be published; failures are stored as `rejected` with the reason.
- FR-66: Each item stores its generation metadata (module, agent and skill versions, model, date, validator verdict).
- FR-67: Published content can be unpublished at once.
- FR-68: Per child, the parent controls: Whyzy on or off (master switch), which modules are allowed, chat on or off (default off), and show text on or off (default off, so audio only).
- FR-69: The child sees only what the parent turned on.
- FR-70: Tapping a content card plays it as audio with the avatar; text shows only if enabled.
- FR-71: Child card screens follow the Figma design "Storytelling App Design for Kids", adapted to Whyzy.

### Should Have (Post-Pilot)

- FR-40: Verifiable parental consent under DPDP Rule 10 (for example DigiLocker).
- FR-41: Native app via Expo.
- FR-42: Replies in Hindi and other Indic languages.

### Nice to Have (Future)

- FR-50: Paid plans.
- FR-51: Self-host edition with compliance notice and privacy-safe defaults.

## 5. Non-Functional Requirements

- NFR-01 Latency: median under 3 seconds from talk-button release to reply audio start.
- NFR-02 Safety: 100% pass on the red-team suite is a release gate.
- NFR-03 Privacy: no audio stored anywhere; child voice never leaves the device; no prompt or reply content in Vercel logs (IDs and event types only).
- NFR-04 Data residency: Vercel Functions in `bom1`; Turso in `ap-south-1`; no replicas outside India.
- NFR-05 Model data use (pilot): `disallowPromptTraining: true` and `zeroDataRetention: true` on AI Gateway.
- NFR-06 No tracking: no analytics, no SDK telemetry, no ads, no engagement tricks, no behavioural tracking of children.
- NFR-07 Secrets: Vercel environment variables only, never in the repo.
- NFR-08 Cost: low monthly cap in test phase; per-child rate limit and monthly cap in pilot.
- NFR-09 Scale: up to 20 families in pilot (well inside Turso Starter limits).

## 6. Constraints

- Stack fixed: Vercel, Next.js, AI SDK (no Mastra, Haystack or CopilotKit), AI Gateway, Turso, Auth.js, ElevenLabs, Petdex.
- Test phase: free Nemotron model, made-up data only; never real children's data during build or test.
- Gemini API and training free tiers are not allowed for children's traffic.
- On-device STT browser support is limited (Chrome 139+ desktop; Edge Canary/Dev; not ChromeOS).
- Pilot timeline: under 3 months; up to 20 families.
- Build order: seven phases, one per session; safety layer and test suite before voice or avatar.
- DPDP Act: under-18s are children; core obligations apply from 13 May 2027.

## 7. Out of Scope

- Public launch, paid plans, full DPDP Rule 10 verification (pilot uses written consent).
- Native mobile app.
- Replies in any language other than English.
- Input languages other than English and Hindi.
- Auto-detected input language or code-mixed (Hinglish) input.
- Automatic memory or learning from chats.
- Always-listening voice.
- Web browsing, links, purchases.
- In-app engagement metrics or behavioural tracking.
- Child accounts or child logins.

## 8. Open Questions & Risks

| # | Question / Risk | Owner | Priority |
|---|----------------|-------|----------|
| 1 | On-device Hindi STT with `processLocally` is unverified; may not be available. | TBD | High |
| 2 | Children's real devices may be phones or tablets; on-device STT support there is unclear. | TBD | High |
| 3 | Under-3-second latency with input classifier + model + full-reply moderation + TTS; may need sentence-level moderation and streaming TTS. | TBD | High |
| 4 | Moderation model or classifier not chosen; input filter must handle Hindi, output moderation English only. | TBD | High |
| 5 | Pilot model not chosen (Claude API default candidate); Hindi understanding and child tone to be tested. | TBD | High |
| 6 | ElevenLabs terms bar under-18 users; fallback TTS undecided. | TBD | High |
| 6a | Young Hindi-speaking children (4–6) may not understand English replies. | TBD | Medium |
| 7 | Parent alert channel for distress (email, push, SMS) not specified. | TBD | High |
| 8 | Parent consent form and privacy notice not drafted. | TBD | High |
| 9 | Survey targets for satisfaction and engagement not set; survey tool not chosen. | TBD | Medium |
| 10 | Petdex pet licences not confirmed. | TBD | Medium |
| 11 | Name clearance (domain, app store, IP India trademark) not done. | TBD | Medium |
| 12 | Hindi input test cases need native-speaker review. | TBD | Medium |
| 13 | Retention job mechanism (for example Vercel Cron) not specified. | TBD | Low |
| 14 | Behaviour when a child exceeds the per-child rate limit not specified. | TBD | Low |
| 15 | Publish content automatically after both checks, or only after operator approval? | Operator | High |
| 16 | Pre-generate and store narration audio for published content, or generate speech each time? | Operator | Medium |
| 17 | Which proposed modules to keep (SPEC.md, Content cards and modules). | Operator | Medium |
| 18 | Nursery rhymes: original only, or also public-domain traditional rhymes (licence check)? | Operator | Medium |

## 9. Assumptions

- Input language (English or Hindi) is set per child profile by the parent; replies are always English.
- Pilot families are known to the operator and use supported desktop browsers.
- Engagement is measured only through parent-reported survey answers.
- Pilot runs before 13 May 2027 but follows DPDP principles anyway.
- Legal review happens before any public launch, not before the pilot.
