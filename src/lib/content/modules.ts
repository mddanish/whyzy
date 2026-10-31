// The library's modules. Synced into the content DB by `npm run content:migrate`.
// Each module has AGENT.md and SKILL.md under content/modules/<id>/ (Phase 9).
export type CollectionDef = { slug: string; title: string };
// `colors`: gradient for the module's cards in child mode.
export type ModuleDef = { id: string; title: string; description: string; emoji: string; colors: [string, string]; collections: CollectionDef[] };

export const MODULES: ModuleDef[] = [
  { id: "stories", title: "Stories", description: "Short original stories.", emoji: "📖", colors: ["#f97316", "#ec4899"], collections: [{ slug: "animal-stories", title: "Animal stories" }, { slug: "friendship-stories", title: "Friendship stories" }, { slug: "adventure-stories", title: "Little adventures" }] },
  { id: "poems", title: "Poems", description: "Short original poems.", emoji: "🪶", colors: ["#8b5cf6", "#ec4899"], collections: [{ slug: "nature-poems", title: "Nature poems" }, { slug: "animal-poems", title: "Animal poems" }, { slug: "everyday-poems", title: "Everyday poems" }] },
  { id: "nursery-rhymes", title: "Nursery rhymes", description: "Original and traditional rhymes.", emoji: "🎵", colors: ["#f59e0b", "#ef4444"], collections: [{ slug: "original-rhymes", title: "New rhymes" }, { slug: "traditional-rhymes", title: "Classic rhymes" }] },
  { id: "good-and-bad", title: "Good things and bad things", description: "Good habits and choices, and what to avoid.", emoji: "🌟", colors: ["#22c55e", "#0ea5e9"], collections: [{ slug: "good-habits", title: "Good habits" }, { slug: "kind-choices", title: "Kind choices" }] },
  { id: "fun-facts", title: "Fun facts", description: "Animals, space, nature and the body.", emoji: "🔭", colors: ["#06b6d4", "#6366f1"], collections: [{ slug: "animal-facts", title: "Animal facts" }, { slug: "space-facts", title: "Space facts" }, { slug: "nature-facts", title: "Nature facts" }] },
  { id: "riddles-jokes", title: "Riddles and jokes", description: "Gentle riddles and silly jokes.", emoji: "😄", colors: ["#facc15", "#f97316"], collections: [{ slug: "riddles", title: "Riddles" }, { slug: "silly-jokes", title: "Silly jokes" }] },
  { id: "why-questions", title: "Why questions", description: "Big questions with simple answers.", emoji: "❓", colors: ["#3b82f6", "#8b5cf6"], collections: [{ slug: "sky-and-weather", title: "Sky and weather" }, { slug: "animals-and-plants", title: "Animals and plants" }] },
  { id: "feelings-kindness", title: "Feelings and kindness", description: "Naming feelings and being kind.", emoji: "💛", colors: ["#f472b6", "#f59e0b"], collections: [{ slug: "naming-feelings", title: "Naming feelings" }, { slug: "being-kind", title: "Being kind" }] },
  { id: "calm-bedtime", title: "Calm and bedtime", description: "Breathing and sleepy stories.", emoji: "🌙", colors: ["#6366f1", "#1e3a8a"], collections: [{ slug: "breathing", title: "Calm breathing" }, { slug: "sleepy-stories", title: "Sleepy stories" }] },
  { id: "numbers-letters", title: "Numbers and letters", description: "Counting and the alphabet.", emoji: "🔢", colors: ["#10b981", "#14b8a6"], collections: [{ slug: "counting", title: "Counting" }, { slug: "alphabet", title: "Alphabet fun" }] },
  { id: "festivals-india", title: "Festivals and India", description: "Festivals, places and traditions.", emoji: "🪔", colors: ["#f97316", "#eab308"], collections: [{ slug: "festivals", title: "Festivals" }, { slug: "places-of-india", title: "Places of India" }] },
  { id: "moral-stories", title: "Moral stories", description: "Original fables with a lesson.", emoji: "🦉", colors: ["#84cc16", "#059669"], collections: [{ slug: "animal-fables", title: "Animal fables" }, { slug: "clever-tales", title: "Clever tales" }] },
];

export function moduleStyle(id: string): { emoji: string; colors: [string, string] } {
  const m = MODULES.find((x) => x.id === id);
  return m ? { emoji: m.emoji, colors: m.colors } : { emoji: "✨", colors: ["#6366f1", "#8b5cf6"] };
}
