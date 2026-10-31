// The library's modules. Synced into the content DB by `npm run content:migrate`.
// Each module has AGENT.md and SKILL.md under content/modules/<id>/ (Phase 9).
export type ModuleDef = { id: string; title: string; description: string; emoji: string };

export const MODULES: ModuleDef[] = [
  { id: "stories", title: "Stories", description: "Short original stories.", emoji: "📖" },
  { id: "poems", title: "Poems", description: "Short original poems.", emoji: "🪶" },
  { id: "nursery-rhymes", title: "Nursery rhymes", description: "Original and traditional rhymes.", emoji: "🎵" },
  { id: "good-and-bad", title: "Good things and bad things", description: "Good habits and choices, and what to avoid.", emoji: "🌟" },
  { id: "fun-facts", title: "Fun facts", description: "Animals, space, nature and the body.", emoji: "🔭" },
  { id: "riddles-jokes", title: "Riddles and jokes", description: "Gentle riddles and silly jokes.", emoji: "😄" },
  { id: "why-questions", title: "Why questions", description: "Big questions with simple answers.", emoji: "❓" },
  { id: "feelings-kindness", title: "Feelings and kindness", description: "Naming feelings and being kind.", emoji: "💛" },
  { id: "calm-bedtime", title: "Calm and bedtime", description: "Breathing and sleepy stories.", emoji: "🌙" },
  { id: "numbers-letters", title: "Numbers and letters", description: "Counting and the alphabet.", emoji: "🔢" },
  { id: "festivals-india", title: "Festivals and India", description: "Festivals, places and traditions.", emoji: "🪔" },
  { id: "moral-stories", title: "Moral stories", description: "Original fables with a lesson.", emoji: "🦉" },
];
