"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useCallback, useEffect, useState } from "react";
import { type AvatarState, pictureEmoji } from "@/lib/avatar";
import { SPEECH_LANG, usePushToTalk } from "@/lib/voice/speech";
import { Pill } from "./cards";

type Meta = { picture: string; kind: string; tts: string };
type ChatMessage = UIMessage<unknown, { meta: Meta }>;

const textOf = (m: ChatMessage) => m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
function metaOf(m: ChatMessage): Meta | undefined {
  for (const p of m.parts) if (p.type === "data-meta") return p.data as Meta;
}

// Push-to-talk chat with Whyzy. Shown only when the parent turned chat on.
export function ChatView({
  language,
  showText,
  speaking,
  say,
  onLimit,
  onAvatar,
}: {
  language: "en" | "hi";
  showText: boolean;
  speaking: boolean;
  say: (text: string, sig: string) => void;
  onLimit: () => void;
  onAvatar: (s: AvatarState | null) => void;
}) {
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat<ChatMessage>({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onFinish: ({ message, isAbort }) => {
      const meta = metaOf(message);
      if (isAbort || !meta) return;
      if (meta.kind === "limit") return onLimit();
      say(textOf(message), meta.tts);
    },
  });
  const busy = status === "submitted" || status === "streaming";
  const send = useCallback((text: string) => text.trim() && !busy && sendMessage({ text }), [busy, sendMessage]);
  const talk = usePushToTalk(SPEECH_LANG[language], send);

  useEffect(() => {
    onAvatar(talk.listening ? "listening" : busy ? "thinking" : null);
  }, [talk.listening, busy, onAvatar]);

  const lastReply = [...messages].reverse().find((m) => m.role === "assistant");
  const picture = lastReply ? pictureEmoji(metaOf(lastReply)?.picture ?? "") : null;

  return (
    <section className="flex w-full max-w-xl flex-col items-center gap-5">
      {showText ? (
        <div className="flex min-h-24 w-full items-center gap-3 rounded-2xl bg-white/10 p-5 text-xl leading-relaxed" aria-live="polite">
          {picture && <span className="text-5xl" aria-hidden>{picture}</span>}
          <p>{busy ? "Hmm, let me think…" : lastReply ? textOf(lastReply) : "Hold the button and ask me anything!"}</p>
        </div>
      ) : (
        picture && <span className="text-7xl" aria-hidden>{picture}</span>
      )}

      {talk.support === "available" ? (
        <button
          type="button"
          onPointerDown={talk.start}
          onPointerUp={talk.stop}
          onPointerLeave={talk.stop}
          onContextMenu={(e) => e.preventDefault()}
          disabled={busy || speaking}
          aria-label="Hold to talk"
          className="wz-pill disabled:opacity-50"
        >
          <span className={`!size-36 !rounded-full !text-5xl ${talk.listening ? "!bg-[radial-gradient(120%_160%_at_50%_0%,#ffa974,#ea5745)]" : ""}`}>
            {talk.listening ? "👂" : "🎤"}
          </span>
        </button>
      ) : (
        talk.support !== "checking" && (
          <p className="text-center text-lg text-[color:var(--wz-fg-2)]">
            Talking is not set up on this device. Ask a grown-up to check voice in the parent area.
          </p>
        )
      )}

      {showText && (
        <>
          <Pill color="orange" onClick={() => setTyping((t) => !t)} label="Type instead">⌨️</Pill>
          {typing && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
                setInput("");
              }}
              className="flex w-full gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={500}
                className="flex-1 rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-xl text-white placeholder:text-white/50"
                placeholder="Type your question"
                aria-label="Your question"
              />
              <Pill onClick={() => { send(input); setInput(""); }} label="Ask" disabled={busy}>Ask</Pill>
            </form>
          )}
        </>
      )}
    </section>
  );
}
