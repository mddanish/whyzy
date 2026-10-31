import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "@/db/central/schema";
import { accessKeys, users } from "@/db/central/schema";

type Db = LibSQLDatabase<typeof schema>;

export function generateAccessKey(): string {
  return `wz_${randomBytes(24).toString("base64url")}`;
}

export function hashAccessKey(key: string): string {
  return createHash("sha256").update(key.trim()).digest("hex");
}

export async function storeAccessKeys(
  db: Db,
  keys: string[],
  expiresAt: Date,
): Promise<void> {
  await db
    .insert(accessKeys)
    .values(keys.map((k) => ({ keyHash: hashAccessKey(k), expiresAt })));
}

export type RegisterInput = {
  name: string;
  email: string;
  passwordHash: string;
  accessKey: string;
  now?: Date;
};

export type RegisterResult =
  | { ok: true; userId: string }
  | { ok: false; error: "invalid_key" | "email_taken" };

class RegisterError extends Error {
  constructor(readonly code: "invalid_key" | "email_taken") {
    super(code);
  }
}

// Creates a parent account and spends the access key in one transaction.
// If the key is missing, expired or already used, nothing is written.
export async function registerParent(
  db: Db,
  input: RegisterInput,
): Promise<RegisterResult> {
  const now = input.now ?? new Date();
  const keyHash = hashAccessKey(input.accessKey);
  const email = input.email.trim().toLowerCase();
  const keyIsUsable = and(
    eq(accessKeys.keyHash, keyHash),
    isNull(accessKeys.usedAt),
    gt(accessKeys.expiresAt, now),
  );

  try {
    const userId = await db.transaction(async (tx) => {
      const key = await tx
        .select({ keyHash: accessKeys.keyHash })
        .from(accessKeys)
        .where(keyIsUsable)
        .get();
      if (!key) throw new RegisterError("invalid_key");

      const existing = await tx
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .get();
      if (existing) throw new RegisterError("email_taken");

      const [user] = await tx
        .insert(users)
        .values({
          name: input.name.trim(),
          email,
          passwordHash: input.passwordHash,
        })
        .returning({ id: users.id });

      const claimed = await tx
        .update(accessKeys)
        .set({ usedBy: user.id, usedAt: now })
        .where(keyIsUsable)
        .returning({ keyHash: accessKeys.keyHash });
      if (claimed.length !== 1) throw new RegisterError("invalid_key");

      return user.id;
    });
    return { ok: true, userId };
  } catch (err) {
    if (err instanceof RegisterError) return { ok: false, error: err.code };
    throw err;
  }
}
