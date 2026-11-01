
// ElevenLabs text to speech, called from the server or operator scripts only
// (SPEC.md, Voice); never from the browser.
// Only the moderated reply text is sent, with names and details removed.
// Training opt-out must be on in the ElevenLabs account (OPERATOR_TODO.md).
// The API key comes from ELEVENLABS_API_KEY, or from a Vercel Connect
// connector (ELEVENLABS_CONNECTOR, e.g. "elevenlabs/whyzy"), which issues it
// at runtime using the deployment's OIDC token.
export function ttsConfigured(): boolean {
  return Boolean((process.env.ELEVENLABS_API_KEY || process.env.ELEVENLABS_CONNECTOR) && process.env.ELEVENLABS_VOICE_ID);
}

async function apiKey(): Promise<string> {
  if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY;
  const { getToken } = await import("@vercel/connect");
  return getToken(process.env.ELEVENLABS_CONNECTOR!, { subject: { type: "app" } } as never);
}

export async function elevenLabsSpeech(text: string, signal?: AbortSignal): Promise<ArrayBuffer> {
  const voice = encodeURIComponent(process.env.ELEVENLABS_VOICE_ID!);
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_64`,
    {
      method: "POST",
      headers: {
        "xi-api-key": await apiKey(),
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: process.env.ELEVENLABS_MODEL_ID ?? "eleven_flash_v2_5",
        language_code: "en",
      }),
      signal,
    },
  );
  if (!res.ok) throw new Error(`elevenlabs_${res.status}`);
  return res.arrayBuffer();
}
