"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AvatarState } from "@/lib/avatar";
import { getPet, PETS } from "@/lib/pets";
import { speak } from "@/lib/voice/speech";
import { Avatar } from "./avatar";
import { ItemCard, ModuleCard, Pill, ShelfTitle } from "./cards";
import { ChatView } from "./chat-view";
import { quicksand } from "./fonts";
import { type CardItem, Player } from "./player";

const HEARTBEAT_S = 30;

type ModuleRow = { id: string; title: string; description: string; emoji: string; count: number };
type Shelf = { id: string; title: string; items: { id: string; title: string; tags: string[] }[] };
type View =
  | { name: "start" }
  | { name: "home" }
  | { name: "module"; module: ModuleRow }
  | { name: "player"; item: CardItem; module: ModuleRow }
  | { name: "chat" }
  | { name: "pick" }
  | { name: "winddown" };

export type ChildAppProps = {
  name: string;
  language: "en" | "hi";
  pet: string;
  chatEnabled: boolean;
  showText: boolean;
  remainingSeconds: number;
  intro: { text: string; sig: string };
  windDown: { text: string; sig: string };
};

const getJson = async <T,>(url: string): Promise<T | null> => {
  const r = await fetch(url).catch(() => null);
  return r?.ok ? ((await r.json()) as T) : null;
};

export function ChildApp(props: ChildAppProps) {
  const [view, setView] = useState<View>(props.remainingSeconds > 0 ? { name: "start" } : { name: "winddown" });
  const [petSlug, setPetSlug] = useState(props.pet);
  const [speaking, setSpeaking] = useState(false);
  const [happy, setHappy] = useState(false);
  const [chatAvatar, setChatAvatar] = useState<AvatarState | null>(null);
  const [modules, setModules] = useState<ModuleRow[] | null>(null);
  const [shelves, setShelves] = useState<Shelf[] | null>(null);
  const pet = getPet(petSlug);

  const cheer = useCallback(() => {
    setHappy(true);
    setTimeout(() => setHappy(false), 1800);
  }, []);

  const say = useCallback(
    (text: string, sig: string) => {
      setSpeaking(true);
      speak(text, sig, () => {
        setSpeaking(false);
        cheer();
      });
    },
    [cheer],
  );

  const windDown = useCallback(() => {
    setView({ name: "winddown" });
    say(props.windDown.text, props.windDown.sig);
  }, [say, props.windDown]);

  // Library: modules the parent allows, with published cards for this child.
  useEffect(() => {
    let live = true;
    getJson<{ modules: ModuleRow[] }>("/api/content").then((d) => live && setModules(d?.modules ?? []));
    return () => {
      live = false;
    };
  }, []);

  const openModule = async (module: ModuleRow) => {
    setShelves(null);
    setView({ name: "module", module });
    const d = await getJson<{ shelves: Shelf[] }>(`/api/content?module=${encodeURIComponent(module.id)}`);
    setShelves(d?.shelves ?? []);
  };

  const openItem = async (module: ModuleRow, id: string, tags: string[]) => {
    const d = await getJson<{ item: Omit<CardItem, "tags"> }>(`/api/content?item=${encodeURIComponent(id)}`);
    if (d?.item) setView({ name: "player", module, item: { ...d.item, tags } });
  };

  // Daily time limit: count visible time once the child has started.
  const viewRef = useRef(view.name);
  useEffect(() => {
    viewRef.current = view.name;
  }, [view.name]);
  useEffect(() => {
    const t = setInterval(async () => {
      if (document.visibilityState !== "visible" || viewRef.current === "winddown" || viewRef.current === "start") return;
      const d = await fetch("/api/child/usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seconds: HEARTBEAT_S }),
      })
        .then((r) => (r.ok ? (r.json() as Promise<{ remainingSeconds: number }>) : null))
        .catch(() => null);
      if (d && d.remainingSeconds <= 0) windDown();
    }, HEARTBEAT_S * 1000);
    return () => clearInterval(t);
  }, [windDown]);

  const avatarState: AvatarState =
    view.name === "winddown" ? "winddown" : (view.name === "chat" && chatAvatar) || (speaking ? "speaking" : happy ? "happy" : "idle");
  const home = () => setView({ name: "home" });

  return (
    <main className={`wz-child ${quicksand.variable} flex min-h-dvh flex-col items-center gap-6 px-4 py-6 select-none`}>
      <header className="flex w-full max-w-5xl items-center justify-between gap-3 text-sm">
        <span className="rounded-full bg-white/10 px-3 py-1">🤖 Whyzy is a computer helper, not a person</span>
        <div className="flex items-center gap-2">
          {view.name !== "start" && view.name !== "home" && view.name !== "winddown" && (
            <Pill color="orange" onClick={home} label="Home">🏠</Pill>
          )}
          <Link href="/unlock" className="rounded-full bg-white/10 px-3 py-2" aria-label="Grown-ups only">🔒</Link>
        </div>
      </header>

      <Avatar pet={pet} state={avatarState} size={view.name === "home" || view.name === "module" ? 120 : 200} />

      {view.name === "start" && (
        <Pill
          big
          onClick={() => {
            home();
            say(props.intro.text, props.intro.sig); // spoken AI disclosure
          }}
        >
          👋 {props.showText ? `Hi ${props.name}! Tap to start` : "Start"}
        </Pill>
      )}

      {view.name === "winddown" && (
        <div className="max-w-xl rounded-2xl bg-white/10 p-6 text-center text-2xl">
          <p>🌙{props.showText ? ` ${props.windDown.text}` : ""}</p>
        </div>
      )}

      {view.name === "home" && (
        <section className="flex w-full max-w-5xl flex-col gap-6">
          {modules === null ? (
            <p className="text-center text-4xl" aria-label="Loading">✨</p>
          ) : modules.length === 0 && !props.chatEnabled ? (
            <p className="text-center text-xl text-[color:var(--wz-fg-2)]">📚 New cards are coming soon!</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {props.chatEnabled && (
                <button
                  type="button"
                  onClick={() => setView({ name: "chat" })}
                  aria-label="Talk to Whyzy"
                  className="relative h-[168px] overflow-hidden rounded-[10px] text-left active:scale-[0.98]"
                  style={{ background: "linear-gradient(135deg, #2876fd, #65eaff)" }}
                >
                  <span className="absolute -right-2 bottom-[-12px] text-[120px] leading-none" aria-hidden>🎤</span>
                  {props.showText && <span className="wz-title absolute left-4 top-4 text-[28px] text-white">Talk to Whyzy</span>}
                </button>
              )}
              {modules.map((m) => (
                <ModuleCard key={m.id} id={m.id} title={m.title} description={m.description} showText={props.showText} onOpen={() => openModule(m)} />
              ))}
            </div>
          )}
          <div className="flex justify-center">
            <Pill color="orange" onClick={() => setView({ name: "pick" })} label="Pick your pet">🐾</Pill>
          </div>
        </section>
      )}

      {view.name === "module" && (
        <section className="flex w-full max-w-5xl flex-col gap-6">
          <ShelfTitle title={view.module.title} onBack={home} showText={props.showText} />
          {shelves === null ? (
            <p className="text-center text-4xl" aria-label="Loading">✨</p>
          ) : props.showText ? (
            shelves.map((s) => (
              <div key={s.id}>
                <ShelfTitle title={s.title} showText />
                <div className="wz-row">
                  {s.items.map((it) => (
                    <ItemCard key={it.id} moduleId={view.module.id} title={it.title} tags={it.tags} showText onPlay={() => openItem(view.module, it.id, it.tags)} />
                  ))}
                </div>
              </div>
            ))
          ) : (
            // Audio only: one grid of picture cards, no shelf titles.
            <div className="flex flex-wrap justify-center gap-6">
              {shelves.flatMap((s) => s.items).map((it) => (
                <ItemCard key={it.id} moduleId={view.module.id} title={it.title} tags={it.tags} showText={false} onPlay={() => openItem(view.module, it.id, it.tags)} />
              ))}
            </div>
          )}
        </section>
      )}

      {view.name === "player" && (
        <Player
          item={view.item}
          showText={props.showText}
          onSpeaking={setSpeaking}
          onDone={cheer}
          onBack={() => openModule(view.module)}
        />
      )}

      {view.name === "chat" && props.chatEnabled && (
        <ChatView
          language={props.language}
          showText={props.showText}
          speaking={speaking}
          say={say}
          onLimit={windDown}
          onAvatar={setChatAvatar}
        />
      )}

      {view.name === "pick" && (
        <div className="grid max-w-xl grid-cols-3 gap-3 sm:grid-cols-4">
          {PETS.map((p) => (
            <button
              key={p.slug}
              className={`rounded-2xl bg-white/10 p-4 text-5xl active:scale-95 ${p.slug === petSlug ? "ring-4 ring-sky-400" : ""}`}
              aria-label={p.name}
              onClick={() => {
                setPetSlug(p.slug);
                home();
                fetch("/api/child/pet", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pet: p.slug }) }).catch(() => {});
              }}
            >
              {p.emoji}
            </button>
          ))}
        </div>
      )}
    </main>
  );
}
