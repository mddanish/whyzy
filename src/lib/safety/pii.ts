// Removes personal details before text reaches the model or TTS:
// phone numbers, emails, addresses, school names, PIN codes and full names.

export type PiiKind = "phone" | "email" | "address" | "school" | "name" | "pincode";
const R = "[removed]";

const PATTERNS: { kind: PiiKind; re: RegExp }[] = [
  { kind: "email", re: /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g },
  { kind: "phone", re: /(?:\+?\d[\d\s-]{8,}\d)/g },
  // "I live at/in 12 Rose Street", "my address is ...", house numbers, road/nagar/colony names
  {
    kind: "address",
    re: /\b(?:i live (?:at|in|on)|my (?:home |house )?address is|my house is (?:at|in|on|near))\s+[^.!?,\n]{2,60}/gi,
  },
  {
    kind: "address",
    re: /\b\d{1,5}[\s,/-]*(?:[A-Z][\w-]*\s){0,3}(?:street|road|lane|nagar|colony|sector|block|apartments?|society|marg|gali|chowk|avenue)\b/gi,
  },
  { kind: "pincode", re: /\b[1-9]\d{2}\s?\d{3}\b/g },
  // "my school is X", "I go to X School", "I study at X"
  {
    kind: "school",
    re: /\b(?:my school is|my school'?s name is|i go to|i study (?:at|in)|i am in|i'?m in)\s+(?:the\s+)?([A-Z][\w'.-]*\s?){1,5}(?:school|vidyalaya|academy|convent|public school|high school)\b/gi,
  },
  { kind: "school", re: /\b(?:[A-Z][\w'.-]*\s){1,4}(?:School|Vidyalaya|Academy|Convent)\b/g },
  // "my name is Asha Rao", "my friend Ravi Kumar", "my teacher's name is ..."
  {
    kind: "name",
    re: /\b(?:my (?:full )?name is|my (?:friend|brother|sister|teacher|mom|mum|dad|neighbou?r|cousin)(?:'s name)?(?: is| called)?)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+/g,
  },
];

// Devanagari address and school markers.
const HI_PATTERNS: { kind: PiiKind; re: RegExp }[] = [
  { kind: "address", re: /(?:मेरा पता|मैं)\s[^।?!\n]{0,40}(?:में रहता|में रहती|रोड|नगर|कॉलोनी|गली)[^।?!\n]{0,10}/g },
  { kind: "school", re: /(?:मेरा स्कूल|मेरे स्कूल का नाम)[^।?!\n]{0,40}/g },
  { kind: "name", re: /(?:मेरा पूरा नाम|मेरे दोस्त का नाम)[^।?!\n]{0,30}/g },
];

export function stripPersonalDetails(text: string, opts: { childName?: string } = {}): { text: string; found: PiiKind[] } {
  const found = new Set<PiiKind>();
  let out = text;
  for (const { kind, re } of [...PATTERNS, ...HI_PATTERNS]) {
    out = out.replace(re, () => {
      found.add(kind);
      return R;
    });
  }
  // The child's own name is never sent to the model or TTS.
  const name = opts.childName?.trim();
  if (name && name.length > 1) {
    const esc = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(`(^|[^\\p{L}])${esc}(?=$|[^\\p{L}])`, "giu"), (_m, pre) => `${pre}friend`);
  }
  return { text: out, found: [...found] };
}
