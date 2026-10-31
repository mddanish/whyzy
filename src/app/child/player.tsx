"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { hasLocalVoice, speakLocally, stopSpeaking } from "@/lib/voice/speech";
import { coverEmoji, Pill } from "./cards";

export type CardItem = { id: string; title: string; moduleId: string; parts: string[]; tags: string[] };

// Plays a card part by part: stored narration first, the device's own
// voice as a fallback. If neither exists, the text is shown instead.
export function Player({
  item,
  showText,
  onSpeaking,
  onDone,
  onBack,
}: {
  item: CardItem;
  showText: boolean;
  onSpeaking: (on: boolean) => void;
  onDone: () => void;
  onBack: () => void;
}) {
  const [part, setPart] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [noVoice, setNoVoice] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const run = useRef(0); // cancels stale playback

  const stop = useCallback(() => {
    run.current++;
    audio.current?.pause();
    audio.current = null;
    stopSpeaking();
    setPlaying(false);
    onSpeaking(false);
  }, [onSpeaking]);

  const play = useCallback(
    async (from: number) => {
      stop();
      const my = ++run.current;
      setPlaying(true);
      onSpeaking(true);
      for (let i = from; i < item.parts.length; i++) {
        if (run.current !== my) return;
        setPart(i);
        const ok = await playPart(item.id, i, item.parts[i], audio);
        if (!ok) setNoVoice(true);
      }
      if (run.current !== my) return;
      setPlaying(false);
      onSpeaking(false);
      onDone();
    },
    [item, onDone, onSpeaking, stop],
  );

  useEffect(() => {
    // Start playing when the card opens (the tap was the user gesture).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- playback state follows the opened card
    void play(0);
    return () => stop();
  }, [play, stop]);

  const text = showText || noVoice;
  return (
    <section className="flex w-full max-w-xl flex-col items-center gap-5">
      <span className="text-8xl" aria-hidden>{coverEmoji(item.moduleId, item.tags)}</span>
      {text && <h2 className="wz-title text-center text-3xl">{item.title}</h2>}
      {text && (
        <p className="min-h-24 rounded-2xl bg-white/10 p-5 text-center text-2xl leading-relaxed whitespace-pre-line" aria-live="polite">
          {item.parts[part]}
        </p>
      )}
      <div className="flex gap-2" aria-hidden>
        {item.parts.map((_, i) => (
          <span key={i} className={`size-3 rounded-full ${i === part ? "bg-white" : "bg-white/30"}`} />
        ))}
      </div>
      <div className="flex gap-4">
        <Pill big color="orange" onClick={onBack} label="Back">◀</Pill>
        {playing ? (
          <Pill big onClick={stop} label="Pause">⏸</Pill>
        ) : (
          <Pill big onClick={() => play(part >= item.parts.length - 1 ? 0 : part)} label="Play">▶</Pill>
        )}
        <Pill big onClick={() => play(Math.min(part + 1, item.parts.length - 1))} label="Next" disabled={part >= item.parts.length - 1}>⏭</Pill>
      </div>
    </section>
  );
}

// Resolves true when the part was heard (stored audio or device voice).
async function playPart(itemId: string, idx: number, text: string, ref: { current: HTMLAudioElement | null }): Promise<boolean> {
  try {
    const res = await fetch(`/api/content/audio?item=${encodeURIComponent(itemId)}&part=${idx}`);
    if (res.status === 200) {
      const url = URL.createObjectURL(await res.blob());
      const a = new Audio(url);
      ref.current = a;
      await new Promise<void>((resolve) => {
        a.onended = a.onerror = a.onpause = () => resolve();
        a.play().catch(() => resolve());
      });
      URL.revokeObjectURL(url);
      return true;
    }
  } catch {}
  if (!hasLocalVoice()) {
    await new Promise((r) => setTimeout(r, 4000)); // time to read the shown text
    return false;
  }
  await new Promise<void>((resolve) => speakLocally(text, resolve));
  return true;
}
