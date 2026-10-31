"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useCallback, useState } from "react";
import { SPEECH_LANG, speak, usePushToTalk } from "@/lib/voice/speech";

type Meta = { picture: string; kind: string; tts: string };
export type ChatMessage = UIMessage<unknown, { meta: Meta }>;

export function textOf(m: ChatMessage): string {
  return m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
}

export function metaOf(m: ChatMessage): Meta | undefined {
  for (const p of m.parts) if (p.type === "data-meta") return p.data as Meta;
}

export function Chat({ name, language }: { name: string; language: "en" | "hi" }) {
  const [input, setInput] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const { messages, sendMessage, status } = useChat<ChatMessage>({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    // Speak each finished reply once.
    onFinish: ({ message, isAbort }) => {
      const meta = metaOf(message);
      if (isAbort || !meta) return;
      setSpeaking(true);
      speak(textOf(message), meta.tts, () => setSpeaking(false));
    },
  });
  const busy = status === "submitted" || status === "streaming";

  const send = useCallback(
    (text: string) => {
      if (!text.trim() || busy) return;
      sendMessage({ text });
    },
    [busy, sendMessage],
  );
  const talk = usePushToTalk(SPEECH_LANG[language], send);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-lg">Hi {name}! Hold the button and ask me anything.</p>
      <ul className="flex flex-col gap-2">
        {messages.map((m) => (
          <li key={m.id} className={m.role === "user" ? "self-end rounded-xl bg-indigo-100 px-3 py-2 text-indigo-950" : "self-start rounded-xl bg-amber-100 px-3 py-2 text-amber-950"}>
            {textOf(m)}
          </li>
        ))}
      </ul>
      {talk.support === "available" ? (
        <button
          type="button"
          onPointerDown={talk.start}
          onPointerUp={talk.stop}
          onPointerLeave={talk.stop}
          disabled={busy || speaking}
          className="rounded-full bg-indigo-600 px-6 py-6 text-2xl font-bold text-white disabled:opacity-50"
        >
          {talk.listening ? "Listening…" : busy ? "Thinking…" : "Hold to talk"}
        </button>
      ) : (
        talk.support !== "checking" && (
          <p className="text-sm opacity-70">Talking is not ready on this device. Ask a grown-up to check voice setup. You can type instead.</p>
        )
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
          setInput("");
        }}
        className="flex gap-2"
      >
        <input value={input} onChange={(e) => setInput(e.target.value)} maxLength={500} className="flex-1 rounded-lg border px-3 py-2" placeholder="Type here" />
        <button className="rounded-lg bg-indigo-600 px-4 py-2 text-white" disabled={busy}>Send</button>
      </form>
    </div>
  );
}
