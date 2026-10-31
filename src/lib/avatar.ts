// App moments for the avatar (FR-25) and how they map to Petdex states.
export const AVATAR_STATES = ["idle", "listening", "thinking", "speaking", "happy", "winddown"] as const;
export type AvatarState = (typeof AVATAR_STATES)[number];

// Self-hosted sprite manifest: public/pets/<slug>/manifest.json, written when a
// licensed Petdex pet is added (see public/pets/README.md). One spritesheet,
// one row per state.
export type SpriteManifest = {
  sheet: string; // file name next to the manifest
  frameWidth: number;
  frameHeight: number;
  states: Record<AvatarState, { row: number; frames: number; fps: number }>;
};

// Petdex has 9 states; these are the ones each app moment uses.
export const PETDEX_STATE_FOR: Record<AvatarState, string> = {
  idle: "idle",
  listening: "listening",
  thinking: "thinking",
  speaking: "talking",
  happy: "happy",
  winddown: "sleeping",
};

// A small emoji for the model's picture keyword. Unknown keywords show nothing.
const PICTURES: Record<string, string> = {
  sky: "🌤️", sun: "☀️", moon: "🌙", star: "⭐", stars: "✨", planet: "🪐", space: "🚀", rocket: "🚀",
  earth: "🌍", rain: "🌧️", rainbow: "🌈", cloud: "☁️", snow: "❄️", tree: "🌳", flower: "🌸", leaf: "🍃",
  plant: "🌱", ocean: "🌊", sea: "🌊", water: "💧", fish: "🐟", whale: "🐋", dolphin: "🐬", cat: "🐱",
  dog: "🐶", bird: "🐦", lion: "🦁", tiger: "🐯", elephant: "🐘", monkey: "🐵", cow: "🐮", horse: "🐴",
  rabbit: "🐰", butterfly: "🦋", bee: "🐝", ant: "🐜", spider: "🕷️", dinosaur: "🦕", dragon: "🐉",
  apple: "🍎", banana: "🍌", mango: "🥭", book: "📚", music: "🎵", ball: "⚽", train: "🚂", car: "🚗",
  number: "🔢", numbers: "🔢", letter: "🔤", letters: "🔤", heart: "💖", volcano: "🌋", mountain: "⛰️",
};

export function pictureEmoji(keyword: string): string | null {
  return PICTURES[keyword.trim().toLowerCase()] ?? null;
}
