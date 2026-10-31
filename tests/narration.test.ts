import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { ContentDb } from "@/db/content/client";
import { itemAudio } from "@/db/content/schema";
import { createDraft, ensureCollection, listShelves, setStatus } from "@/lib/content/library";
import { getPartAudio, itemsMissingAudio, narrateAll, narrateItem, type Speech } from "@/lib/content/narrate";
import { tempContentDb } from "./support/helpers";

let db: ContentDb;
let cleanup: () => void;
beforeEach(async () => ({ db, cleanup } = await tempContentDb()));
afterEach(() => cleanup());

const fakeSpeech = () => {
  const calls: string[] = [];
  const speech: Speech = { voice: "test-voice", mime: "audio/mpeg", synthesize: async (t) => { calls.push(t); return new TextEncoder().encode(`mp3:${t}`).buffer as ArrayBuffer; } };
  return { speech, calls };
};

async function published(title: string, parts: string[], collection = "animal-stories") {
  const collectionId = await ensureCollection(db, { moduleId: "stories", slug: collection, title: "Animal stories" });
  const id = (await createDraft(db, { collectionId, moduleId: "stories", title, ageBands: ["4-6"], parts, tags: ["cat"] }))!;
  await setStatus(db, id, "validated");
  await setStatus(db, id, "published");
  return id;
}

describe("narration", () => {
  it("is made once per part and stored", async () => {
    const id = await published("Cat Nap", ["The cat yawned.", "The cat slept."]);
    expect(await itemsMissingAudio(db)).toEqual([id]);
    const { speech, calls } = fakeSpeech();
    expect(await narrateItem(db, id, speech)).toBe(2);
    expect(await narrateItem(db, id, speech)).toBe(0); // never made twice
    expect(calls).toEqual(["The cat yawned.", "The cat slept."]);
    expect(await itemsMissingAudio(db)).toEqual([]);
    const a = await getPartAudio(db, id, 1);
    expect(a?.mime).toBe("audio/mpeg");
    expect(Buffer.from(a!.audio).toString()).toBe("mp3:The cat slept.");
  });

  it("is not served once an item is unpublished", async () => {
    const id = await published("Cat Nap", ["The cat yawned."]);
    await narrateItem(db, id, fakeSpeech().speech);
    await setStatus(db, id, "unpublished");
    expect(await getPartAudio(db, id, 0)).toBeUndefined();
  });

  it("skips drafts, and does nothing without a speech service", async () => {
    const collectionId = await ensureCollection(db, { moduleId: "stories", slug: "animal-stories", title: "Animal stories" });
    await createDraft(db, { collectionId, moduleId: "stories", title: "Draft", ageBands: ["4-6"], parts: ["Not yet."] });
    expect(await itemsMissingAudio(db)).toEqual([]);
    delete process.env.ELEVENLABS_API_KEY;
    expect(await narrateAll(db)).toEqual({ items: 0, parts: 0 });
    expect(await db.select().from(itemAudio)).toHaveLength(0);
  });
});

describe("shelves", () => {
  it("groups a module's visible items by collection", async () => {
    await published("Cat Nap", ["The cat yawned."]);
    await published("Dog Walk", ["The dog ran."], "friendship-stories");
    const shelves = await listShelves(db, "stories", "4-6");
    expect(shelves.map((s) => [s.title, s.items.map((i) => i.title)])).toEqual([
      ["Animal stories", ["Cat Nap"]],
      ["Friendship stories", ["Dog Walk"]],
    ]);
    expect(await listShelves(db, "stories", "4-6", ["poems"])).toEqual([]);
    expect(await listShelves(db, "stories", "13+")).toEqual([]);
  });
});
