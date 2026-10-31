import { PERSONA_LINE } from "@/lib/ai/prompt";

export type InputIntent =
  | "allowed"
  | "persona"
  | "self_harm"
  | "distress"
  | "jailbreak"
  | "secrets"
  | "strangers"
  | "medical"
  | "violence"
  | "sexual"
  | "substances"
  | "scary"
  | "purchases"
  | "links";

// Fixed replies. No model call is made for any of these.
export const FIXED_REPLY: Record<Exclude<InputIntent, "allowed">, string> = {
  persona: PERSONA_LINE,
  self_harm:
    "You matter so much. Please go to a grown-up you trust right now, like your mum, dad or teacher, and tell them how you feel. They want to help you.",
  distress:
    "I'm sorry you feel this way. Please find a grown-up you trust right now, like your mum, dad or teacher, and tell them. They can help you.",
  jailbreak: "I'm Whyzy, a computer helper, and I always follow my safety rules. What would you like to learn about?",
  secrets: "I don't keep secrets from your parents. It's always okay to tell a parent or a grown-up you trust.",
  strangers:
    "I can't meet anyone. I'm a computer helper. If someone asks to meet you or wants photos, tell a parent or a trusted grown-up.",
  medical: "Medicine questions are for a parent or a doctor. Please ask a grown-up you trust.",
  violence: "That's not something I can talk about. Let's learn something fun instead! Do you want to hear about animals or space?",
  sexual: "That's a question for a parent or a grown-up you trust. Let's talk about something else. What is your favourite animal?",
  substances: "That's a question for a parent or a grown-up you trust. Shall we learn about plants or planets instead?",
  scary: "Let's keep things happy and calm! Do you want to hear about friendly animals instead?",
  purchases: "I can't buy things or handle money. Please ask a grown-up to help with that.",
  links: "I can't open websites or links. A grown-up can help you look things up safely.",
};

export const PII_REMINDER = "Remember, keep things like your address, school and phone number private. ";
export const OUTPUT_FALLBACK = "Hmm, let's talk about something else. What animal do you like?";
