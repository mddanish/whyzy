import { type LanguageModel, type ModelMessage, Output, streamText } from "ai";
import * as z from "zod";
import type { AgeBand } from "@/db/family/schema";
import { systemPrompt } from "@/lib/ai/prompt";

export const ReplySchema = z.object({
  text: z.string(),
  picture: z.string().optional().default(""),
});
export type Reply = z.infer<typeof ReplySchema>;

export type ModelRef = { model: LanguageModel; providerOptions?: Record<string, Record<string, unknown>> };

// Calls the model through AI Gateway and returns the whole structured reply.
// The reply is not shown until output moderation has passed, so it is
// collected in full here rather than streamed to the child.
export async function generateReply(
  ref: ModelRef,
  opts: { ageBand: AgeBand; interests?: string; history: ModelMessage[]; signal?: AbortSignal },
): Promise<Reply> {
  const result = streamText({
    model: ref.model,
    instructions: systemPrompt(opts),
    messages: opts.history,
    output: Output.object({ schema: ReplySchema }),
    providerOptions: ref.providerOptions as never,
    maxOutputTokens: 1500,
    temperature: 0.5,
    abortSignal: opts.signal,
    // The default handler prints the request body (the child's words). Never log it.
    onError: () => {},
  });
  try {
    return await result.output;
  } catch {
    // Some models ignore the schema. Fall back to the plain text.
    return parseLoose(await result.text);
  }
}

export function parseLoose(raw: string): Reply {
  const match = raw.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      const parsed = ReplySchema.safeParse(JSON.parse(match[0]));
      if (parsed.success) return parsed.data;
    } catch {}
  }
  return { text: raw.trim(), picture: "" };
}
