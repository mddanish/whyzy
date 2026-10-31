"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

// On-device speech recognition (Web Speech API with processLocally = true).
// The child's voice never leaves the device: if on-device recognition is not
// available we show a message and never fall back to cloud recognition.

type Availability = "available" | "downloadable" | "downloading" | "unavailable";
type Options = { langs: string[]; processLocally: boolean };
type Result = { 0: { transcript: string }; isFinal: boolean };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  processLocally: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<Result> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};
type RecognitionCtor = {
  new (): Recognition;
  available?: (o: Options) => Promise<Availability>;
  install?: (o: Options) => Promise<boolean>;
};

export const SPEECH_LANG = { en: "en-IN", hi: "hi-IN" } as const;
export type SpeechSupport = Availability | "unsupported";

function ctor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor };
  // Only the standard constructor supports processLocally; the webkit-prefixed
  // one would send audio to a cloud service, so it is never used.
  const C = w.SpeechRecognition;
  if (!C || typeof C.available !== "function" || !("processLocally" in C.prototype)) return null;
  return C;
}

// The parent checks voice on the child's device (FR-21); the result is kept
// on this device so child mode does not probe the speech engine itself.
const verifiedKey = (lang: string) => `wz-voice-${lang}`;

function remember(lang: string, status: SpeechSupport) {
  try {
    if (status === "available") localStorage.setItem(verifiedKey(lang), "available");
    else localStorage.removeItem(verifiedKey(lang));
  } catch {}
}

export async function checkOnDevice(lang: string): Promise<SpeechSupport> {
  const C = ctor();
  let status: SpeechSupport = "unsupported";
  if (C) {
    try {
      status = await C.available!({ langs: [lang], processLocally: true });
    } catch {
      status = "unavailable";
    }
  }
  remember(lang, status);
  return status;
}

export async function installOnDevice(lang: string): Promise<boolean> {
  const C = ctor();
  if (!C?.install) return false;
  try {
    const ok = await C.install({ langs: [lang], processLocally: true });
    if (ok) remember(lang, "available");
    return ok;
  } catch {
    return false;
  }
}

function verifiedOnThisDevice(lang: string): SpeechSupport {
  try {
    return ctor() && localStorage.getItem(verifiedKey(lang)) === "available" ? "available" : "unavailable";
  } catch {
    return "unavailable";
  }
}

const noSubscribe = () => () => {};

// Push to talk: start() while the button is held, stop() on release.
export function usePushToTalk(lang: string, onText: (text: string) => void) {
  const support = useSyncExternalStore<SpeechSupport | "checking">(
    noSubscribe,
    () => verifiedOnThisDevice(lang),
    () => "checking",
  );
  const [listening, setListening] = useState(false);
  const rec = useRef<Recognition | null>(null);
  const text = useRef("");
  const onTextRef = useRef(onText);
  useEffect(() => {
    onTextRef.current = onText;
  }, [onText]);

  useEffect(() => () => rec.current?.abort(), []);

  const start = useCallback(() => {
    const C = ctor();
    if (!C || support !== "available" || rec.current) return;
    const r = new C();
    r.lang = lang;
    r.processLocally = true; // never stream audio to a server
    r.continuous = true;
    r.interimResults = false;
    text.current = "";
    r.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) text.current += ` ${e.results[i][0].transcript}`;
      }
    };
    r.onerror = () => {}; // never retry with a cloud service
    r.onend = () => {
      rec.current = null;
      setListening(false);
      const said = text.current.trim();
      if (said) onTextRef.current(said);
    };
    rec.current = r;
    r.start();
    setListening(true);
  }, [lang, support]);

  const stop = useCallback(() => rec.current?.stop(), []);

  return { support, listening, start, stop };
}

// Plays the reply: server TTS when configured, else an on-device voice.
export async function speak(text: string, sig: string, onEnd: () => void): Promise<void> {
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, sig }),
    });
    if (res.status === 200) {
      const url = URL.createObjectURL(await res.blob());
      const audio = new Audio(url);
      audio.onended = audio.onerror = () => {
        URL.revokeObjectURL(url);
        onEnd();
      };
      await audio.play();
      return;
    }
  } catch {}
  speakLocally(text, onEnd);
}

export function speakLocally(text: string, onEnd: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return onEnd();
  const voices = window.speechSynthesis.getVoices().filter((v) => v.localService && v.lang.startsWith("en"));
  if (voices.length === 0) return onEnd(); // no on-device voice: text only
  const u = new SpeechSynthesisUtterance(text);
  u.voice = voices.find((v) => v.lang === "en-IN") ?? voices[0];
  u.rate = 0.95;
  u.onend = u.onerror = () => onEnd();
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

// True when this device has an on-device English voice for speakLocally.
export function hasLocalVoice(): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  return window.speechSynthesis.getVoices().some((v) => v.localService && v.lang.startsWith("en"));
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}
