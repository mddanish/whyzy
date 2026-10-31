import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { INTRO_LINE } from "@/lib/ai/prompt";
import { TIME_UP } from "@/lib/chat/service";
import { usedSeconds } from "@/lib/chat/usage";
import { getChildContext } from "@/lib/dal";
import { sign } from "@/lib/sign";
import { ChildApp } from "./child-app";

export default function ChildPage() {
  return (
    <Suspense fallback={<main className="flex min-h-dvh items-center justify-center bg-sky-100 text-2xl">✨</main>}>
      <Child />
    </Suspense>
  );
}

// Child mode: no settings, no links out, no account details.
async function Child() {
  const ctx = await getChildContext();
  if (!ctx) redirect("/parent");
  const { child } = ctx;
  if (!child.whyzyEnabled) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-sky-100 px-4 text-center text-2xl text-zinc-900">
        <p>🌙 Whyzy is resting now.</p>
        <Link href="/unlock" className="rounded-full bg-white/80 px-3 py-1 text-sm" aria-label="Grown-ups only">🔒</Link>
      </main>
    );
  }
  const purpose = `tts:${child.id}`;
  return (
    <ChildApp
      name={child.displayName}
      language={child.inputLanguage}
      pet={child.avatarPet}
      chatEnabled={child.chatEnabled}
      showText={child.showText}
      remainingSeconds={child.dailyMinutes * 60 - (await usedSeconds(ctx.db, child.id))}
      intro={{ text: INTRO_LINE, sig: sign(INTRO_LINE, purpose) }}
      windDown={{ text: TIME_UP, sig: sign(TIME_UP, purpose) }}
    />
  );
}
