import { gateway } from "ai";

// The model name lives in one environment variable (FR-19).
export const DEFAULT_TEST_MODEL = "nvidia/nemotron-3.5-lightning-free";

export type Stage = "test" | "pilot";

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
): { name: string; providerOptions: Record<string, Record<string, boolean>> } {
  if (isBlockedModel(name)) throw new Error(`Model ${name} is not allowed for children's apps`);
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

export function chatModel() {
  const { name, providerOptions } = modelConfig();
  return { model: gateway(name), providerOptions };
}
