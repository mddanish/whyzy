"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState } from "react";

export function Chat({ name }: { name: string }) {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });
  const busy = status === "submitted" || status === "streaming";
  return (
    <div className="flex flex-col gap-4">
      <p className="text-lg">Hi {name}! Ask me anything.</p>
      <ul className="flex flex-col gap-2">
        {messages.map((m) => (
          <li key={m.id} className={m.role === "user" ? "self-end rounded-xl bg-indigo-100 px-3 py-2 text-indigo-950" : "self-start rounded-xl bg-amber-100 px-3 py-2 text-amber-950"}>
            {m.parts.map((p, i) => (p.type === "text" ? <span key={i}>{p.text}</span> : null))}
          </li>
        ))}
      </ul>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!input.trim() || busy) return;
          sendMessage({ text: input });
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
