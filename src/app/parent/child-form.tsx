"use client";

import { useActionState } from "react";
import { saveChildAction } from "@/app/actions/family";
import { buttonClass, Field, Message, Select } from "@/app/ui";
import { PETS } from "@/lib/pets";

export type ChildValues = {
  id?: string;
  displayName?: string;
  ageBand?: string;
  interests?: string;
  avatarPet?: string;
  inputLanguage?: string;
  dailyMinutes?: number;
};

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
      <Message state={state} />
      <button className={buttonClass} disabled={pending}>
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
