import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

// HMAC with AUTH_SECRET. Used for the child-mode cookie and to prove that
// text sent to /api/tts is a reply this server produced and moderated.
export function sign(value: string, purpose: string): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return createHmac("sha256", secret).update(`${purpose}:${value}`).digest("base64url");
}

export function verify(value: string, purpose: string, mac: string): boolean {
  const expected = Buffer.from(sign(value, purpose));
  const actual = Buffer.from(mac);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
