import type { AgeBand } from "@/db/family/schema";
import type { InputIntent } from "./responses";
import { matches, normalize, RULES } from "./rules";

// Order matters: the most serious signal wins.
const ORDER = [
  "self_harm",
  "distress",
  "jailbreak",
  "secrets",
  "strangers",
  "sexual",
  "violence",
  "medical",
  "substances",
  "purchases",
  "links",
] as const;

const SCARY_BANDS: AgeBand[] = ["4-6", "7-9", "10-12"];

export function classifyInput(raw: string, ageBand: AgeBand): InputIntent {
  const text = normalize(raw);
  for (const intent of ORDER) if (matches(RULES[intent], text)) return intent;
  if (SCARY_BANDS.includes(ageBand) && matches(RULES.scary, text)) return "scary";
  if (matches(RULES.persona, text)) return "persona";
  return "allowed";
}

export const ALERT_INTENTS: InputIntent[] = ["self_harm", "distress"];
