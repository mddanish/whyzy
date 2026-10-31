import { describe, expect, it } from "vitest";
import { stripPersonalDetails } from "@/lib/safety/pii";
import { sign, verify } from "@/lib/sign";

process.env.AUTH_SECRET = "test-secret-not-real";

describe("TTS text", () => {
  it("removes the child's name before speech is generated", () => {
    expect(stripPersonalDetails("Great job, Test Kid! Keep going, test kid.", { childName: "Test Kid" }).text).toBe(
      "Great job, friend! Keep going, friend.",
    );
  });
  it("only signed replies for the same child can be spoken", () => {
    const sig = sign("Hello!", "tts:child-1");
    expect(verify("Hello!", "tts:child-1", sig)).toBe(true);
    expect(verify("Hello?", "tts:child-1", sig)).toBe(false);
    expect(verify("Hello!", "tts:child-2", sig)).toBe(false);
  });
});
