"use client";

import { useEffect, useState } from "react";
import type { AvatarState, SpriteManifest } from "@/lib/avatar";
import type { Pet } from "@/lib/pets";

const LABEL: Record<AvatarState, string> = {
  idle: "waiting",
  listening: "listening",
  thinking: "thinking",
  speaking: "talking",
  happy: "happy",
  winddown: "sleepy",
};

export function Avatar({ pet, state, size = 200 }: { pet: Pet; state: AvatarState; size?: number }) {
  const [manifest, setManifest] = useState<SpriteManifest | null>(null);
  useEffect(() => {
    if (!pet.licensed) return;
    let live = true;
    fetch(`/pets/${pet.slug}/manifest.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((m) => live && setManifest(m))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [pet]);

  return (
    <div role="img" aria-label={`${pet.name} is ${LABEL[state]}`} style={{ width: size, height: size }} className="relative">
      {manifest ? <Sprite slug={pet.slug} manifest={manifest} state={state} size={size} /> : <BuiltIn pet={pet} state={state} size={size} />}
    </div>
  );
}

function Sprite({ slug, manifest, state, size }: { slug: string; manifest: SpriteManifest; state: AvatarState; size: number }) {
  const s = manifest.states[state] ?? manifest.states.idle;
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setFrame((f) => (f + 1) % s.frames), 1000 / s.fps);
    return () => clearInterval(t);
  }, [s.frames, s.fps]);
  const scale = size / manifest.frameWidth;
  return (
    <div style={{ width: size, height: manifest.frameHeight * scale, overflow: "hidden" }}>
      <div
        style={{
          width: manifest.frameWidth,
          height: manifest.frameHeight,
          backgroundImage: `url(/pets/${slug}/${manifest.sheet})`,
          backgroundPosition: `-${frame * manifest.frameWidth}px -${s.row * manifest.frameHeight}px`,
          backgroundRepeat: "no-repeat",
          imageRendering: "pixelated",
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      />
    </div>
  );
}

// Built-in avatar: a soft circle in the pet's colour with its emoji, animated per state.
function BuiltIn({ pet, state, size }: { pet: Pet; state: AvatarState; size: number }) {
  return (
    <div className={`wz-avatar wz-${state} flex h-full w-full items-center justify-center rounded-full`} style={{ background: `${pet.color}33`, boxShadow: `inset 0 0 0 6px ${pet.color}55` }}>
      <span style={{ fontSize: size * 0.5, lineHeight: 1 }} aria-hidden>{pet.emoji}</span>
      {state === "listening" && <span className="wz-ring absolute inset-0 rounded-full" style={{ borderColor: pet.color }} />}
      {state === "thinking" && <span className="absolute -top-2 right-2 text-3xl" aria-hidden>💭</span>}
      {state === "happy" && <span className="absolute -top-2 left-2 text-3xl" aria-hidden>✨</span>}
      {state === "winddown" && <span className="absolute -top-2 right-4 text-3xl" aria-hidden>💤</span>}
    </div>
  );
}
