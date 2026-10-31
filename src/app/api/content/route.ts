import { contentDbConfigured, getContentDb } from "@/db/content/client";
import { getItem, listCollections, listItems, listModules } from "@/lib/content/library";
import { getChildContext } from "@/lib/dal";

// Child-facing library reads. Published content only, filtered to the
// child's age band.
//   ?            modules
//   ?module=id   collections in a module
//   ?collection=id  items in a collection
//   ?item=id     one item with its parts
export async function GET(req: Request) {
  const ctx = await getChildContext();
  if (!ctx) return new Response(null, { status: 401 });
  if (!contentDbConfigured()) return Response.json({ ready: false, modules: [] });

  const q = new URL(req.url).searchParams;
  const db = getContentDb();
  const band = ctx.child.ageBand;
  const id = (k: string) => (q.get(k) ?? "").slice(0, 64);

  if (q.has("item")) {
    const item = await getItem(db, id("item"), band);
    return item ? Response.json({ item }) : new Response(null, { status: 404 });
  }
  if (q.has("collection")) return Response.json({ items: await listItems(db, id("collection"), band) });
  if (q.has("module")) return Response.json({ collections: await listCollections(db, id("module"), band) });
  return Response.json({ ready: true, modules: await listModules(db, band) });
}
