import { gateway, generateSpeech } from "ai";

// Text to speech, called from the server or operator scripts only (SPEC.md,
// Voice); never from the browser. Only moderated reply text or published
// card text is sent, with names and details removed.
//
// WHYZY_TTS:
// - "gateway" (default when ELEVENLABS_VOICE_ID is set): ElevenLabs through
//   Vercel AI Gateway (WHYZY_TTS_MODEL, default elevenlabs/eleven-flash-v2.5).
// - "elevenlabs": ElevenLabs directly, with ELEVENLABS_API_KEY or a Vercel
//   Connect connector (ELEVENLABS_CONNECTOR, e.g. "elevenlabs/whyzy").
// Training opt-out must be on with the speech provider (OPERATOR_TODO.md).
type Mode = "gateway" | "elevenlabs";

function mode(): Mode {
  return process.env.WHYZY_TTS === "elevenlabs" ? "elevenlabs" : "gateway";
}

export function ttsConfigured(): boolean {
  if (!process.env.ELEVENLABS_VOICE_ID) return false;
  return mode() === "gateway" || Boolean(process.env.ELEVENLABS_API_KEY || process.env.ELEVENLABS_CONNECTOR);
}

export function ttsVoiceLabel(): string {
  const model = mode() === "gateway" ? (process.env.WHYZY_TTS_MODEL ?? "elevenlabs/eleven-flash-v2.5") : "elevenlabs:eleven_flash_v2_5";
  return `${model}:${process.env.ELEVENLABS_VOICE_ID}`;
}

export async function elevenLabsSpeech(text: string, signal?: AbortSignal): Promise<ArrayBuffer> {
  return mode() === "gateway" ? viaGateway(text, signal) : direct(text, signal);
}

async function viaGateway(text: string, signal?: AbortSignal): Promise<ArrayBuffer> {
  const { audio } = await generateSpeech({
    model: gateway.speech(process.env.WHYZY_TTS_MODEL ?? "elevenlabs/eleven-flash-v2.5"),
    text,
    voice: process.env.ELEVENLABS_VOICE_ID!,
    abortSignal: signal,
  });
  const bytes = audio.uint8Array;
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

async function apiKey(): Promise<string> {
  if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY;
  const { getToken } = await import("@vercel/connect");
  return getToken(process.env.ELEVENLABS_CONNECTOR!, { subject: { type: "app" } } as never);
}

async function direct(text: string, signal?: AbortSignal): Promise<ArrayBuffer> {
  const voice = encodeURIComponent(process.env.ELEVENLABS_VOICE_ID!);
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_64`, {
    method: "POST",
    headers: { "xi-api-key": await apiKey(), "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({ text, model_id: process.env.ELEVENLABS_MODEL_ID ?? "eleven_flash_v2_5", language_code: "en" }),
    signal,
  });
  if (!res.ok) throw new Error(`elevenlabs_${res.status}`);
  return res.arrayBuffer();
}
