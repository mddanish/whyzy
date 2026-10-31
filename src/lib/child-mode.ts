import "server-only";
import { cookies } from "next/headers";
import { sign, verify } from "@/lib/sign";

// Child mode: a signed, httpOnly cookie naming the child profile in use.
// While it is set, the parent area needs the parent PIN.
const COOKIE = "wz_child";

export function encodeChildCookie(parentId: string, childId: string): string {
  const value = `${parentId}.${childId}`;
  return `${value}.${sign(value, "child-mode")}`;
}

export function decodeChildCookie(raw: string | undefined, parentId: string): string | null {
  if (!raw) return null;
  const parts = raw.split(".");
  if (parts.length !== 3) return null;
  const [pid, cid, mac] = parts;
  if (!verify(`${pid}.${cid}`, "child-mode", mac)) return null;
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
