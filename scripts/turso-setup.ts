// Creates the central database in Mumbai and writes its URL and token
// into .env.local. The token is never printed.
import { readFileSync, writeFileSync } from "node:fs";
import {
  createDatabase,
  createDatabaseToken,
  ensureMumbaiGroup,
} from "../src/lib/turso-platform";

const DB_NAME = process.env.TURSO_CENTRAL_DB_NAME ?? "whyzy-central";
const ENV_FILE = ".env.local";

async function main() {
  const current = readFileSync(ENV_FILE, "utf8");
  if (/^TURSO_CENTRAL_URL=.+/m.test(current)) {
    console.log(`TURSO_CENTRAL_URL already set in ${ENV_FILE}; nothing to do.`);
    return;
  }
  const group = await ensureMumbaiGroup();
  console.log(`Using group ${group.name} (${group.primary ?? group.locations?.join(",")})`);

  const { hostname } = await createDatabase(DB_NAME, group.name);
  const token = await createDatabaseToken(DB_NAME);

  const cleaned = current.replace(/^TURSO_CENTRAL_(URL|AUTH_TOKEN)=.*\n?/gm, "");
  const sep = cleaned === "" || cleaned.endsWith("\n") ? "" : "\n";
  writeFileSync(
    ENV_FILE,
    `${cleaned}${sep}TURSO_CENTRAL_URL=libsql://${hostname}\nTURSO_CENTRAL_AUTH_TOKEN=${token}\n`,
  );
  console.log(`Created ${DB_NAME} at libsql://${hostname}; URL and token saved to ${ENV_FILE}.`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
