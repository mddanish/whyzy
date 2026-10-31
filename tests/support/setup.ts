// Keep tests hermetic: never pick up model or provider settings (or keys)
// from the environment, e.g. during Vercel builds.
for (const k of ["WHYZY_PROVIDER", "WHYZY_MODEL", "WHYZY_STAGE", "OPENROUTER_API_KEY", "MODERATION_MODEL", "CONTENT_MODEL", "CONTENT_VALIDATOR_MODEL", "ELEVENLABS_API_KEY", "ELEVENLABS_VOICE_ID"]) {
  delete process.env[k];
}
