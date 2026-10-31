// The library's modules. Synced into the content DB by `npm run content:migrate`.
// Each module has AGENT.md and SKILL.md under content/modules/<id>/ (Phase 9).
export type CollectionDef = { slug: string; title: string };
export type ModuleDef = { id: string; title: string; description: string; emoji: string; collections: CollectionDef[] };

export const MODULES: ModuleDef[] = [
  { id: "stories", title: "Stories", description: "Short original stories.", emoji: "📖", collections: [{ slug: "animal-stories", title: "Animal stories" }, { slug: "friendship-stories", title: "Friendship stories" }, { slug: "adventure-stories", title: "Little adventures" }] },
  { id: "poems", title: "Poems", description: "Short original poems.", emoji: "🪶", collections: [{ slug: "nature-poems", title: "Nature poems" }, { slug: "animal-poems", title: "Animal poems" }, { slug: "everyday-poems", title: "Everyday poems" }] },
  { id: "nursery-rhymes", title: "Nursery rhymes", description: "Original and traditional rhymes.", emoji: "🎵", collections: [{ slug: "original-rhymes", title: "New rhymes" }, { slug: "traditional-rhymes", title: "Classic rhymes" }] },
  { id: "good-and-bad", title: "Good things and bad things", description: "Good habits and choices, and what to avoid.", emoji: "🌟", collections: [{ slug: "good-habits", title: "Good habits" }, { slug: "kind-choices", title: "Kind choices" }] },
  { id: "fun-facts", title: "Fun facts", description: "Animals, space, nature and the body.", emoji: "🔭", collections: [{ slug: "animal-facts", title: "Animal facts" }, { slug: "space-facts", title: "Space facts" }, { slug: "nature-facts", title: "Nature facts" }] },
  { id: "riddles-jokes", title: "Riddles and jokes", description: "Gentle riddles and silly jokes.", emoji: "😄", collections: [{ slug: "riddles", title: "Riddles" }, { slug: "silly-jokes", title: "Silly jokes" }] },
  { id: "why-questions", title: "Why questions", description: "Big questions with simple answers.", emoji: "❓", collections: [{ slug: "sky-and-weather", title: "Sky and weather" }, { slug: "animals-and-plants", title: "Animals and plants" }] },
  { id: "feelings-kindness", title: "Feelings and kindness", description: "Naming feelings and being kind.", emoji: "💛", collections: [{ slug: "naming-feelings", title: "Naming feelings" }, { slug: "being-kind", title: "Being kind" }] },
  { id: "calm-bedtime", title: "Calm and bedtime", description: "Breathing and sleepy stories.", emoji: "🌙", collections: [{ slug: "breathing", title: "Calm breathing" }, { slug: "sleepy-stories", title: "Sleepy stories" }] },
  { id: "numbers-letters", title: "Numbers and letters", description: "Counting and the alphabet.", emoji: "🔢", collections: [{ slug: "counting", title: "Counting" }, { slug: "alphabet", title: "Alphabet fun" }] },
  { id: "festivals-india", title: "Festivals and India", description: "Festivals, places and traditions.", emoji: "🪔", collections: [{ slug: "festivals", title: "Festivals" }, { slug: "places-of-india", title: "Places of India" }] },
  { id: "moral-stories", title: "Moral stories", description: "Original fables with a lesson.", emoji: "🦉", collections: [{ slug: "animal-fables", title: "Animal fables" }, { slug: "clever-tales", title: "Clever tales" }] },
];
