import { readFileSync } from "node:fs";
import { join } from "node:path";

// Loads the versioned agent and skill files under content/.
export type AgentFile = { version: string; body: string };

const ROOT = join(process.cwd(), "content");

export function parseAgentFile(raw: string): AgentFile {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error("agent file needs front matter");
  const version = m[1].match(/^version:\s*(\S+)/m)?.[1];
  if (!version) throw new Error("agent file needs a version");
  return { version, body: m[2].trim() };
}

const read = (...p: string[]) => parseAgentFile(readFileSync(join(ROOT, ...p), "utf8"));

export const moduleAgent = (moduleId: string) => read("modules", moduleId, "AGENT.md");
export const moduleSkill = (moduleId: string) => read("modules", moduleId, "SKILL.md");
export const validatorAgent = () => read("validator", "AGENT.md");
