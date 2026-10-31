// Pets a child can pick. Only original animals and objects from the
// Petdex Crafter Originals list in SPEC.md (never the "Avoid" list).
// `licensed` stays false until the operator confirms the pet's licence;
// until then the app draws its own built-in avatar for that pet.
export type Pet = { slug: string; name: string; emoji: string; color: string; licensed: boolean };

export const PETS: Pet[] = [
  { slug: "boba", name: "Boba the otter", emoji: "🦦", color: "#a16207", licensed: false },
  { slug: "byte-bunny", name: "Byte Bunny", emoji: "🐰", color: "#db2777", licensed: false },
  { slug: "eagle", name: "Eagle", emoji: "🦅", color: "#92400e", licensed: false },
  { slug: "boxcat", name: "Boxcat", emoji: "🐱", color: "#d97706", licensed: false },
  { slug: "chedarini", name: "Chedarini the chihuahua", emoji: "🐶", color: "#ca8a04", licensed: false },
  { slug: "cache-capy", name: "Cache Capy", emoji: "🦫", color: "#78350f", licensed: false },
  { slug: "prompt-penguin", name: "Prompt Penguin", emoji: "🐧", color: "#1e3a8a", licensed: false },
  { slug: "cosmo", name: "Crafternauta", emoji: "🧑‍🚀", color: "#eab308", licensed: false },
  { slug: "pixel-panda", name: "Pixel Panda", emoji: "🐼", color: "#334155", licensed: false },
  { slug: "socksy", name: "Socksy", emoji: "🧦", color: "#16a34a", licensed: false },
  { slug: "canary", name: "Canary", emoji: "🐤", color: "#facc15", licensed: false },
  { slug: "scoop", name: "Scoop", emoji: "🍦", color: "#f472b6", licensed: false },
  { slug: "sunny", name: "Sunny the cat", emoji: "🐈", color: "#ea580c", licensed: false },
];

export const PET_SLUGS = PETS.map((p) => p.slug) as [string, ...string[]];

export function getPet(slug: string): Pet {
  return PETS.find((p) => p.slug === slug) ?? PETS[0];
}
