// Keyword and pattern rules for English and Hindi (Devanagari and common
// romanised Hindi). English patterns match whole words; Devanagari terms
// match as substrings because \b does not work for Devanagari.

export type Rule = { en?: RegExp; hi?: string[] };

const words = (list: string[], extra?: RegExp) =>
  new RegExp(`\\b(?:${list.join("|")})\\b${extra ? `|${extra.source}` : ""}`, "i");

export const RULES = {
  self_harm: {
    en: words([
      "kill (?:my ?self|myself)", "hurt (?:my ?self|myself)", "cut (?:my ?self|myself)", "harm (?:my ?self|myself)",
      "want to die", "wanna die", "wish i was dead", "wish i were dead", "end my life", "suicide", "suicidal",
      "don'?t want to (?:live|be alive)", "khud ko (?:maar|chot)", "marna chahta", "marna chahti",
    ]),
    hi: ["मरना चाहता", "मरना चाहती", "खुद को चोट", "ख़ुद को चोट", "खुद को मार", "आत्महत्या", "जीना नहीं चाहता", "जीना नहीं चाहती"],
  },
  distress: {
    en: words([
      "(?:he|she|they|someone|somebody|my \\w+) (?:hits|hit|beats|beat|hurts|hurt|touched|touches|kicks|kicked) me",
      "hurting me", "i(?:'m| am) (?:scared|afraid|frightened|so sad|very sad|being bullied|alone and scared)",
      "i feel (?:scared|afraid|sad|unsafe|lonely)", "nobody loves me", "no one loves me", "bully(?:ing)? me", "bullied",
      "touched me", "touch me", "help me please", "please help me", "i'?m in danger", "abuse[sd]?", "mujhe dar",
      "mujhe maarta", "mujhe maarti",
    ]),
    hi: ["मुझे डर", "डर लग रहा", "मुझे मारता", "मुझे मारती", "मुझे मारते", "मुझे छुआ", "बहुत उदास", "मैं उदास", "बचाओ", "मदद करो", "कोई प्यार नहीं"],
  },
  jailbreak: {
    en: words([
      "ignore (?:all |your |the |previous |prior |above )*(?:rules|instructions|prompt|guidelines)",
      "forget (?:all |your |the )*(?:rules|instructions)", "disregard", "pretend (?:to be|you are|you'?re)",
      "you are now", "act as", "role ?-?play", "jailbreak", "dan mode", "developer mode", "system prompt",
      "new instructions", "override", "no rules", "without (?:any )?rules", "unfiltered",
      "repeat after me", "say exactly",
    ], /<\/?\s*(?:system|assistant|instructions?)\s*>|\b(?:system|assistant|developer)\s*:|#{3,}/),
    hi: ["नियम भूल", "नियमों को भूल", "नियम मत मानो", "नियमों को अनदेखा", "तुम अब", "नाटक करो कि"],
  },
  secrets: {
    en: words([
      "(?:don'?t|do not|never) tell (?:my |your |our )?(?:mom|mum|mummy|mother|dad|daddy|papa|father|parents?|teacher|anyone|anybody)",
      "keep (?:it|this|a) (?:a )?secret", "our (?:little )?secret", "secret from (?:my |your )?(?:mom|mum|dad|parents?)",
      "kisi ko mat batana", "mummy ko mat batana", "papa ko mat batana",
    ]),
    hi: ["किसी को मत बताना", "मम्मी को मत बताना", "पापा को मत बताना", "माँ को मत बताना", "राज़ रखना", "राज रखना", "सीक्रेट"],
  },
  strangers: {
    en: words([
      "meet (?:me|you|up)", "can we meet", "come to (?:my|your) (?:house|home|school)", "where do you live",
      "visit (?:me|you)", "video call", "send (?:me )?(?:a |your )?(?:photo|picture|pic|selfie)s?",
      "add me on", "talk to strangers?", "stranger (?:asked|wants|said)",
    ]),
    hi: ["मिलने आओ", "मिल सकते", "मुझसे मिलो", "कहाँ रहते हो", "फोटो भेजो", "फ़ोटो भेजो"],
  },
  medical: {
    en: words([
      "medicines?", "medication", "pills?", "dose", "dosage", "paracetamol", "ibuprofen", "aspirin", "crocin",
      "antibiotics?", "cough syrup", "how much .* (?:take|swallow)", "overdose", "injection", "drugs?",
    ]),
    hi: ["दवा", "दवाई", "गोली", "खुराक", "इंजेक्शन"],
  },
  violence: {
    en: words([
      "guns?", "pistols?", "rifles?", "bombs?", "explosives", "explosive devices?", "knife", "knives", "swords?", "weapons?",
      "kill(?:ing|ed|s)?", "murder\\w*", "shoot(?:ing)?", "stab\\w*", "blood(?:y)?", "torture", "terroris\\w+",
      "beat (?:him|her|them|someone) up", "how to (?:hurt|fight|punch) ",
    ]),
    hi: ["बंदूक", "पिस्तौल", "बम", "चाकू", "तलवार", "हथियार", "हत्या", "खून", "मार डालो", "जान से मार"],
  },
  sexual: {
    en: words(["sex\\w*", "naked", "nude\\w*", "porn\\w*", "boobs?", "penis", "vagina", "private parts?", "make out", "xxx"]),
    hi: ["सेक्स", "नंगा", "नंगी", "अश्लील"],
  },
  substances: {
    en: words(["alcohol", "beer", "wine", "whisky", "vodka", "drunk", "cigarettes?", "smoking", "vaping", "weed", "cocaine"]),
    hi: ["शराब", "सिगरेट", "बीड़ी", "नशा"],
  },
  scary: {
    en: words(["ghosts?", "zombies?", "demons?", "devil", "horror", "haunted", "scary stor(?:y|ies)", "witch(?:es)?", "nightmare stor(?:y|ies)"]),
    hi: ["भूत", "चुड़ैल", "डरावनी", "डरावना", "शैतान"],
  },
  purchases: {
    en: words(["buy", "purchase", "credit card", "debit card", "upi", "pay for", "order online", "shopping cart", "in-app"]),
    hi: ["खरीद", "पैसे भेज"],
  },
  links: {
    en: /\bhttps?:\/\/|\bwww\.|\b[a-z0-9-]+\.(?:com|in|org|net|io|app)\b|\b(?:website|weblink|url|youtube|instagram|tiktok|whatsapp|snapchat|google it|search (?:the )?(?:internet|web))\b/i,
    hi: ["वेबसाइट", "लिंक", "यूट्यूब"],
  },
  persona: {
    en: words([
      "are you (?:a )?(?:real|human|person|alive|robot|computer|machine|ai)", "are you a real person",
      "is this a (?:real )?person", "who are you", "what are you", "are you my friend",
    ]),
    hi: ["क्या तुम असली", "क्या तुम इंसान", "क्या आप असली", "क्या आप इंसान", "तुम कौन हो", "आप कौन हो"],
  },
} satisfies Record<string, Rule>;

export function matches(rule: Rule, text: string): boolean {
  return Boolean(rule.en?.test(text) || rule.hi?.some((t) => text.includes(t)));
}

// Collapse spacing tricks such as "k i l l" or "g.u.n" before matching.
export function normalize(text: string): string {
  return text
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\b[a-z]([\s.\-_*])(?:[a-z]\1)+[a-z]\b/gi, (m) => m.replace(/[\s.\-_*]/g, ""))
    .replace(/\s+/g, " ")
    .trim();
}
