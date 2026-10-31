# Pet sprites

Self-hosted avatar sprites. The app never calls petdex.dev at runtime.

Add a pet only after its licence is confirmed (or Crafter Station has given written permission):

1. `npx petdex install <slug>` and inspect `pet.json` and the spritesheet.
2. Copy the spritesheet here as `public/pets/<slug>/sheet.webp` (or `.png`).
3. Write `public/pets/<slug>/manifest.json` (format: `SpriteManifest` in `src/lib/avatar.ts`), mapping rows for idle, listening, thinking, speaking, happy and winddown.
4. Set `licensed: true` for the pet in `src/lib/pets.ts`.

Until then the app draws its own built-in avatar for each pet.
