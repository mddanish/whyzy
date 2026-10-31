"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { type AvatarState, pictureEmoji } from "@/lib/avatar";
import { getPet, PETS } from "@/lib/pets";
import { SPEECH_LANG, speak, usePushToTalk } from "@/lib/voice/speech";
import { Avatar } from "./avatar";

type Meta = { picture: string; kind: string; tts: string };
export type ChatMessage = UIMessage<unknown, { meta: Meta }>;

const textOf = (m: ChatMessage) => m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
function metaOf(m: ChatMessage): Meta | undefined {
  for (const p of m.parts) if (p.type === "data-meta") return p.data as Meta;
}

const HEARTBEAT_S = 30;
const big = "rounded-3xl px-8 py-6 text-2xl font-bold shadow-md active:scale-95 disabled:opacity-50";

export type ChildAppProps = {
  name: string;
  language: "en" | "hi";
  pet: string;
  remainingSeconds: number;
  intro: { text: string; sig: string };
  windDown: { text: string; sig: string };
};

export function ChildApp(props: ChildAppProps) {
  const [stage, setStage] = useState<"start" | "chat" | "pick" | "winddown">(props.remainingSeconds > 0 ? "start" : "winddown");
  const [petSlug, setPetSlug] = useState(props.pet);
  const [speaking, setSpeaking] = useState(false);
  const [happy, setHappy] = useState(false);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const pet = getPet(petSlug);

  const say = useCallback((text: string, sig: string) => {
    setSpeaking(true);
    speak(text, sig, () => {
      setSpeaking(false);
      setHappy(true);
      setTimeout(() => setHappy(false), 1800);
    });
  }, []);

  const windDown = useCallback(() => {
    setStage("winddown");
    say(props.windDown.text, props.windDown.sig);
  }, [say, props.windDown]);

  const { messages, sendMessage, status } = useChat<ChatMessage>({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onFinish: ({ message, isAbort }) => {
      const meta = metaOf(message);
      if (isAbort || !meta) return;
      if (meta.kind === "limit") return windDown();
      say(textOf(message), meta.tts);
    },
  });
  const busy = status === "submitted" || status === "streaming";
  const send = useCallback((text: string) => text.trim() && !busy && sendMessage({ text }), [busy, sendMessage]);
  const talk = usePushToTalk(SPEECH_LANG[props.language], send);

  // Daily time limit: count visible time in child mode.
  const stageRef = useRef(stage);
  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);
  useEffect(() => {
    const t = setInterval(async () => {
      if (document.visibilityState !== "visible" || stageRef.current === "winddown" || stageRef.current === "start") return;
      const res = await fetch("/api/child/usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seconds: HEARTBEAT_S }),
      }).catch(() => null);
      if (!res?.ok) return;
      const { remainingSeconds } = (await res.json()) as { remainingSeconds: number };
      if (remainingSeconds <= 0) windDown();
    }, HEARTBEAT_S * 1000);
    return () => clearInterval(t);
  }, [windDown]);

  const state: AvatarState =
    stage === "winddown" ? "winddown" : talk.listening ? "listening" : busy ? "thinking" : speaking ? "speaking" : happy ? "happy" : "idle";
  const lastReply = [...messages].reverse().find((m) => m.role === "assistant");
  const picture = lastReply ? pictureEmoji(metaOf(lastReply)?.picture ?? "") : null;

  return (
    <main className="flex min-h-dvh flex-col items-center gap-6 bg-gradient-to-b from-sky-100 to-amber-50 px-4 py-6 text-zinc-900 select-none">
      <header className="flex w-full max-w-xl items-center justify-between text-sm">
        <span className="rounded-full bg-white/80 px-3 py-1">🤖 Whyzy is a computer helper, not a person</span>
        <Link href="/unlock" className="rounded-full bg-white/80 px-3 py-1" aria-label="Grown-ups only">🔒</Link>
      </header>

      <Avatar pet={pet} state={state} size={220} />

      {stage === "start" && (
        <button
          className={`${big} bg-indigo-600 text-white`}
          onClick={() => {
            setStage("chat");
            say(props.intro.text, props.intro.sig);
          }}
        >
          👋 Hi {props.name}! Tap to start
        </button>
      )}

      {stage === "winddown" && (
        <div className="max-w-xl rounded-3xl bg-white/90 p-6 text-center text-2xl">
          <p>🌙 {props.windDown.text}</p>
        </div>
      )}

      {stage === "pick" && (
        <div className="grid max-w-xl grid-cols-3 gap-3 sm:grid-cols-4">
          {PETS.map((p) => (
            <button
              key={p.slug}
              className={`rounded-3xl bg-white p-4 text-5xl shadow active:scale-95 ${p.slug === petSlug ? "ring-4 ring-indigo-500" : ""}`}
              aria-label={p.name}
              onClick={() => {
                setPetSlug(p.slug);
                setStage("chat");
                fetch("/api/child/pet", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pet: p.slug }) }).catch(() => {});
              }}
            >
              {p.emoji}
            </button>
          ))}
        </div>
      )}

      {stage === "chat" && (
        <>
          <div className="flex min-h-24 w-full max-w-xl items-center gap-3 rounded-3xl bg-white/90 p-5 text-xl leading-relaxed" aria-live="polite">
            {picture && <span className="text-5xl" aria-hidden>{picture}</span>}
            <p>{busy ? "Hmm, let me think…" : lastReply ? textOf(lastReply) : props.intro.text}</p>
          </div>

          {talk.support === "available" ? (
            <button
              type="button"
              onPointerDown={talk.start}
              onPointerUp={talk.stop}
              onPointerLeave={talk.stop}
              onContextMenu={(e) => e.preventDefault()}
              disabled={busy || speaking}
              className={`${big} h-36 w-36 rounded-full bg-indigo-600 text-white ${talk.listening ? "bg-rose-500" : ""}`}
            >
              {talk.listening ? "👂" : "🎤"}
              <span className="block text-base font-semibold">{talk.listening ? "Listening" : "Hold to talk"}</span>
            </button>
          ) : (
            talk.support !== "checking" && <p className="text-center">Talking is not set up on this device. Ask a grown-up to check voice in the parent area, or type below.</p>
          )}

          <div className="flex gap-3">
            <button className={`${big} bg-white`} onClick={() => setTyping((t) => !t)} aria-label="Type instead">⌨️</button>
            <button className={`${big} bg-white`} onClick={() => setStage("pick")} aria-label="Pick your pet">🐾</button>
          </div>

          {typing && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
                setInput("");
              }}
              className="flex w-full max-w-xl gap-2"
            >
              <input value={input} onChange={(e) => setInput(e.target.value)} maxLength={500} className="flex-1 rounded-2xl border-2 border-indigo-300 bg-white px-4 py-3 text-xl" placeholder="Type your question" aria-label="Your question" />
              <button className="rounded-2xl bg-indigo-600 px-5 text-xl font-bold text-white" disabled={busy}>Ask</button>
            </form>
          )}
        </>
      )}
    </main>
  );
}
