import { MODULES } from "@/lib/content/modules";

// Parent controls per child (SPEC.md, Content cards and modules).
// Defaults: Whyzy off, chat off, text hidden (audio only), all modules.
export type Controls = {
  whyzyEnabled: boolean;
  allowedModules: string[] | null; // null = all modules
  chatEnabled: boolean;
  showText: boolean;
};

const ALL = MODULES.map((m) => m.id);

// Reads the control checkboxes from the child profile form.
export function parseControls(form: FormData): Controls {
  const picked = form.getAll("modules").map(String).filter((m) => ALL.includes(m));
  return {
    whyzyEnabled: form.get("whyzyEnabled") === "on",
    allowedModules: picked.length === ALL.length ? null : picked,
    chatEnabled: form.get("chatEnabled") === "on",
    showText: form.get("showText") === "on",
  };
}

export function allowedModuleIds(c: Controls): string[] {
  if (!c.whyzyEnabled) return [];
  return c.allowedModules === null ? ALL : c.allowedModules.filter((m) => ALL.includes(m));
}

export const moduleAllowed = (c: Controls, moduleId: string) => allowedModuleIds(c).includes(moduleId);
export const chatAllowed = (c: Controls) => c.whyzyEnabled && c.chatEnabled;
