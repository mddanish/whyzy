import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { gateway, type LanguageModel } from "ai";

// The model name lives in one environment variable (FR-19).
export const DEFAULT_TEST_MODEL = "nvidia/nemotron-3.5-lightning-free";

export type Stage = "test" | "pilot";
export type Provider = "gateway" | "openrouter";

// WHYZY_PROVIDER: "gateway" (Vercel AI Gateway, default) or "openrouter"
// (test phase only, OPENROUTER_API_KEY). Model IDs follow the provider's
// naming, e.g. nvidia/nemotron-3.5-super-vl:free on OpenRouter.
export function getProvider(): Provider {
  return process.env.WHYZY_PROVIDER === "openrouter" ? "openrouter" : "gateway";
}

export function getStage(): Stage {
  return process.env.WHYZY_STAGE === "pilot" ? "pilot" : "test";
}

// Free tiers may keep prompts for training: test data only, never the pilot.
export function isTestOnlyModel(model: string): boolean {
  return /-free$|:free$/.test(model);
}

// Gemini API terms forbid apps for under-18s: blocked in every stage.
export function isBlockedModel(model: string): boolean {
  return model.startsWith("google/");
}

export function modelConfig(
  stage: Stage = getStage(),
  name = process.env.WHYZY_MODEL ?? DEFAULT_TEST_MODEL,
  provider: Provider = getProvider(),
): { name: string; providerOptions: Record<string, Record<string, boolean>> } {
  if (isBlockedModel(name)) throw new Error(`Model ${name} is not allowed for children's apps`);
  // The pilot needs AI Gateway's no-training and zero-retention routing.
  if (stage === "pilot" && provider !== "gateway") throw new Error("The pilot stage must use AI Gateway");
  if (stage === "pilot" && isTestOnlyModel(name)) {
    throw new Error(`Model ${name} is test-only and is blocked in the pilot stage`);
  }
  return {
    name,
    // Pilot: route only to providers that do not train on prompts and keep no data.
    providerOptions:
      stage === "pilot"
        ? { gateway: { disallowPromptTraining: true, zeroDataRetention: true } }
        : {},
  };
}

let openrouter: ReturnType<typeof createOpenRouter> | undefined;

// Any model call (chat, moderation, content) goes through this.
export function languageModel(name: string, provider: Provider = getProvider()): LanguageModel {
  if (isBlockedModel(name)) throw new Error(`Model ${name} is not allowed for children's apps`);
  if (provider === "openrouter") {
    if (getStage() === "pilot") throw new Error("The pilot stage must use AI Gateway");
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");
    openrouter ??= createOpenRouter({ apiKey });
    return openrouter.chat(name);
  }
  return gateway(name);
}

export function chatModel() {
  const { name, providerOptions } = modelConfig();
  return { model: languageModel(name), providerOptions };
}
