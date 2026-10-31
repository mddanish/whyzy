import "server-only";

// ElevenLabs text to speech, called from the server only (SPEC.md, Voice).
// Only the moderated reply text is sent, with names and details removed.
// Training opt-out must be on in the ElevenLabs account (OPERATOR_TODO.md).
export function ttsConfigured(): boolean {
  return Boolean(process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_VOICE_ID);
}

export async function elevenLabsSpeech(text: string, signal?: AbortSignal): Promise<ArrayBuffer> {
  const voice = encodeURIComponent(process.env.ELEVENLABS_VOICE_ID!);
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_64`,
    {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY!,
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
