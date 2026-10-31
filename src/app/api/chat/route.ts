import { createUIMessageStream, createUIMessageStreamResponse, type UIMessage } from "ai";
import * as z from "zod";
import { chatModel } from "@/lib/ai/model";
import { handleChildMessage, type Turn } from "@/lib/chat/service";
import { getChildContext } from "@/lib/dal";

export const maxDuration = 30;

const Body = z.object({
  id: z.string().regex(/^[A-Za-z0-9_-]{8,64}$/),
  messages: z.array(z.custom<UIMessage>()).max(100),
});

function toTurns(messages: UIMessage[]): Turn[] {
  return messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role === "user" ? "child" : "whyzy",
      text: m.parts.map((p) => (p.type === "text" ? p.text : "")).join(" ").trim(),
    }));
}

// Child chat. Never logs message text: IDs and event types only.
export async function POST(req: Request) {
  const ctx = await getChildContext();
  if (!ctx) return new Response("Not in child mode", { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return new Response("Bad request", { status: 400 });

  const result = await handleChildMessage({
    db: ctx.db,
    child: ctx.child,
    settings: ctx.settings,
    chatId: parsed.data.id,
    turns: toTurns(parsed.data.messages),
    model: chatModel,
    signal: req.signal,
  });
  console.info(`[chat] child=${ctx.child.id} kind=${result.kind}`);

  const stream = createUIMessageStream({
    execute({ writer }) {
      writer.write({ type: "start" });
      writer.write({ type: "text-start", id: "reply" });
      writer.write({ type: "text-delta", id: "reply", delta: result.text });
      writer.write({ type: "text-end", id: "reply" });
      writer.write({ type: "data-meta", data: { picture: result.picture, kind: result.kind } });
      writer.write({ type: "finish" });
    },
  });
  return createUIMessageStreamResponse({ stream });
}
