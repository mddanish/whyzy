"use client";

import type { ReactNode } from "react";
import { pictureEmoji } from "@/lib/avatar";
import { moduleStyle } from "@/lib/content/modules";

// Card components adapted from the Figma design: category cards, story cards
// with a cover and a glossy pill button, and shelf titles with a chevron.

export function Pill({
  children,
  onClick,
  color = "blue",
  big = false,
  label,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  color?: "blue" | "orange";
  big?: boolean;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <button type="button" onClick={onClick} aria-label={label} disabled={disabled} className={`wz-pill ${color === "orange" ? "wz-orange" : ""} ${big ? "wz-big" : ""}`}>
      <span>{children}</span>
    </button>
  );
}

// Cover art: the module's colours with an emoji from the item's tags, so
// cards can be told apart without reading (audio-only mode).
export function coverEmoji(moduleId: string, tags: string[] = []): string {
  for (const t of tags) {
    const e = pictureEmoji(t);
    if (e) return e;
  }
  return moduleStyle(moduleId).emoji;
}

function Cover({ moduleId, tags, size }: { moduleId: string; tags: string[]; size: number }) {
  const { colors } = moduleStyle(moduleId);
  const emoji = coverEmoji(moduleId, tags);
  return (
    <div
      className="wz-cover flex shrink-0 items-center justify-center"
      style={{ width: size, height: 200, background: `linear-gradient(160deg, ${colors[0]}, ${colors[1]})` }}
      aria-hidden
    >
      <span style={{ fontSize: size * 0.45 }}>{emoji}</span>
    </div>
  );
}

// "Card Categories": a module.
export function ModuleCard({
  id,
  title,
  description,
  onOpen,
  showText,
}: {
  id: string;
  title: string;
  description: string;
  onOpen: () => void;
  showText: boolean;
}) {
  const { emoji, colors } = moduleStyle(id);
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={title}
      className="relative h-[168px] w-full overflow-hidden rounded-[10px] text-left active:scale-[0.98]"
      style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}
    >
      <span className="absolute -right-2 bottom-[-12px] text-[120px] leading-none opacity-95" aria-hidden>{emoji}</span>
      {showText && (
        <span className="absolute left-4 top-4 flex w-[60%] flex-col gap-2">
          <span className="wz-title text-[28px] leading-[34px] text-white">{title}</span>
          <span className="text-sm leading-5 text-white/90 [text-shadow:0_2px_4px_rgba(0,0,0,0.25)]">{description}</span>
        </span>
      )}
    </button>
  );
}

// "Title Section": shelf heading with a chevron.
export function ShelfTitle({ title, onBack, showText }: { title: string; onBack?: () => void; showText: boolean }) {
  return (
    <div className="flex min-h-11 items-center justify-between">
      {showText ? <h2 className="wz-title text-2xl font-semibold">{title}</h2> : <span />}
      {onBack && (
        <button type="button" onClick={onBack} aria-label="Back" className="flex size-11 items-center justify-center text-2xl">‹</button>
      )}
    </div>
  );
}

// "Card Story": cover on the left, title and a play button on the right.
// Audio-only mode (default): the cover and a play button, no text.
export function ItemCard({
  moduleId,
  title,
  tags,
  onPlay,
  showText,
}: {
  moduleId: string;
  title: string;
  tags: string[];
  onPlay: () => void;
  showText: boolean;
}) {
  return (
    <div className={`wz-card flex items-center ${showText ? "w-[330px]" : "w-[150px] flex-col"}`}>
      <button type="button" onClick={onPlay} aria-label={`Play ${title}`} className="active:scale-[0.98]">
        <Cover moduleId={moduleId} tags={tags} size={150} />
      </button>
      {showText ? (
        <div className="flex h-[200px] flex-1 flex-col justify-between p-4">
          <p className="wz-title text-[22px] leading-7">{title}</p>
          <Pill onClick={onPlay} label={`Play ${title}`}>▶ Play</Pill>
        </div>
      ) : (
        <div className="flex w-full justify-center p-3 [&>.wz-pill]:self-center">
          <Pill onClick={onPlay} label={`Play ${title}`}>▶</Pill>
        </div>
      )}
    </div>
  );
}
