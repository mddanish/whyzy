import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// Child mode: a signed, httpOnly cookie naming the child profile in use.
// While it is set, the parent area needs the parent PIN.
const COOKIE = "wz_child";

function sign(value: string): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function encodeChildCookie(parentId: string, childId: string): string {
  const value = `${parentId}.${childId}`;
  return `${value}.${sign(value)}`;
}

export function decodeChildCookie(raw: string | undefined, parentId: string): string | null {
  if (!raw) return null;
  const parts = raw.split(".");
  if (parts.length !== 3) return null;
  const [pid, cid, mac] = parts;
  const expected = Buffer.from(sign(`${pid}.${cid}`));
  const actual = Buffer.from(mac);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  return pid === parentId ? cid : null;
}

export async function getChildModeId(parentId: string): Promise<string | null> {
  return decodeChildCookie((await cookies()).get(COOKIE)?.value, parentId);
}

export async function enterChildMode(parentId: string, childId: string): Promise<void> {
  (await cookies()).set(COOKIE, encodeChildCookie(parentId, childId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function leaveChildMode(): Promise<void> {
  (await cookies()).delete(COOKIE);
}
