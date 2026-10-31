"use client";

import { useActionState } from "react";
import { saveChildAction } from "@/app/actions/family";
import { buttonClass, Field, Message, Select } from "@/app/ui";
import { MODULES } from "@/lib/content/modules";
import { PETS } from "@/lib/pets";

export type ChildValues = {
  id?: string;
  displayName?: string;
  ageBand?: string;
  interests?: string;
  avatarPet?: string;
  inputLanguage?: string;
  dailyMinutes?: number;
  whyzyEnabled?: boolean;
  allowedModules?: string[] | null;
  chatEnabled?: boolean;
  showText?: boolean;
};

function Check({ name, label, hint, defaultChecked, value }: { name: string; label: string; hint?: string; defaultChecked?: boolean; value?: string }) {
  return (
    <label className="mb-3 flex gap-2 text-sm">
      <input type="checkbox" name={name} value={value} defaultChecked={defaultChecked} className="mt-0.5" />
      <span>
        <span className="font-medium">{label}</span>
        {hint && <span className="block text-xs opacity-70">{hint}</span>}
      </span>
    </label>
  );
}

export function ChildForm({ child }: { child?: ChildValues }) {
  const [state, action, pending] = useActionState(saveChildAction, undefined);
  return (
    <form action={action}>
      {child?.id && <input type="hidden" name="id" value={child.id} />}
      <Field label="First name or nickname" name="displayName" autoComplete="off" defaultValue={child?.displayName} />
      <Select
        label="Age band"
        name="ageBand"
        defaultValue={child?.ageBand ?? "7-9"}
        options={[
          { value: "4-6", label: "4 to 6" },
          { value: "7-9", label: "7 to 9" },
          { value: "10-12", label: "10 to 12" },
          { value: "13+", label: "13 and up" },
        ]}
      />
      <Field label="Interests (optional, e.g. dinosaurs, space)" name="interests" required={false} defaultValue={child?.interests} />
      <Select
        label="Avatar pet"
        name="avatarPet"
        defaultValue={child?.avatarPet ?? PETS[0].slug}
        options={PETS.map((p) => ({ value: p.slug, label: `${p.emoji} ${p.name}` }))}
      />
      <Select
        label="Speaks to Whyzy in"
        name="inputLanguage"
        defaultValue={child?.inputLanguage ?? "en"}
        options={[
          { value: "en", label: "English" },
          { value: "hi", label: "Hindi (Whyzy replies in English)" },
        ]}
      />
      <Field label="Daily time limit (minutes)" name="dailyMinutes" type="number" min={5} max={240} defaultValue={child?.dailyMinutes ?? 30} />
      <fieldset className="mb-4 rounded-lg border border-black/10 p-3 dark:border-white/15">
        <legend className="px-1 text-sm font-semibold">What your child can use</legend>
        <Check name="whyzyEnabled" label="Turn on Whyzy for this child" hint="When off, your child cannot open Whyzy at all." defaultChecked={child?.whyzyEnabled ?? false} />
        <p className="mb-2 mt-1 text-sm font-medium">Card modules</p>
        <div className="mb-3 grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          {MODULES.map((m) => (
            <Check
              key={m.id}
              name="modules"
              value={m.id}
              label={`${m.emoji} ${m.title}`}
              defaultChecked={!child?.allowedModules || child.allowedModules.includes(m.id)}
            />
          ))}
        </div>
        <Check name="chatEnabled" label="Allow chat with Whyzy" hint="Your child can ask Whyzy questions by voice. Every message passes safety checks. Off by default." defaultChecked={child?.chatEnabled ?? false} />
        <Check name="showText" label="Show text on screen" hint="Off by default: your child only hears the content (audio only)." defaultChecked={child?.showText ?? false} />
      </fieldset>
      <Message state={state} />
      <button className={buttonClass} disabled={pending}>
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
