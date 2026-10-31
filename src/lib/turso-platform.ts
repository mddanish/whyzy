// Minimal client for the Turso Platform API (https://docs.turso.tech/api-reference).
// Used by setup scripts now and by family-database creation in Phase 2.

const API = "https://api.turso.tech/v1";

// Mumbai. All Whyzy databases must live here (data stays in India).
export const MUMBAI_LOCATION = process.env.TURSO_LOCATION ?? "aws-ap-south-1";

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env("TURSO_API_TOKEN")}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const body = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(`Turso API ${res.status} on ${path}: ${body.error ?? "unknown error"}`);
  }
  return body;
}

const org = () => encodeURIComponent(env("TURSO_ORG"));

export type TursoGroup = { name: string; primary?: string; locations?: string[] };

export function isMumbai(group: TursoGroup): boolean {
  const where = [group.primary, ...(group.locations ?? [])].filter(Boolean);
  return where.length > 0 && where.every((l) => l!.includes("ap-south-1"));
}

export async function listLocations(): Promise<Record<string, string>> {
  return (await call<{ locations: Record<string, string> }>("/locations")).locations;
}

export async function listGroups(): Promise<TursoGroup[]> {
  return (await call<{ groups: TursoGroup[] }>(`/organizations/${org()}/groups`)).groups;
}

export async function createGroup(name: string, location: string): Promise<TursoGroup> {
  return (
    await call<{ group: TursoGroup }>(`/organizations/${org()}/groups`, {
      method: "POST",
      body: JSON.stringify({ name, location }),
    })
  ).group;
}

export async function createDatabase(name: string, group: string): Promise<{ hostname: string }> {
  const { database } = await call<{ database: { Hostname: string } }>(
    `/organizations/${org()}/databases`,
    { method: "POST", body: JSON.stringify({ name, group }) },
  );
  return { hostname: database.Hostname };
}

export async function deleteDatabase(name: string): Promise<void> {
  await call(`/organizations/${org()}/databases/${encodeURIComponent(name)}`, {
    method: "DELETE",
  });
}

export async function createDatabaseToken(name: string): Promise<string> {
  const { jwt } = await call<{ jwt: string }>(
    `/organizations/${org()}/databases/${encodeURIComponent(name)}/auth/tokens?authorization=full-access`,
    { method: "POST" },
  );
  return jwt;
}

// Returns the Mumbai group, creating it if the account has no group yet.
// Fails if the only group is outside Mumbai: we never place data elsewhere.
export async function ensureMumbaiGroup(name = "whyzy-india"): Promise<TursoGroup> {
  const groups = await listGroups();
  const mumbai = groups.find(isMumbai);
  if (mumbai) return mumbai;
  if (groups.length > 0) {
    throw new Error(
      `No Turso group in Mumbai. Existing groups: ${groups
        .map((g) => `${g.name} (${g.primary ?? g.locations?.join(",")})`)
        .join(", ")}. Starter plan allows one group: delete it or move it to ${MUMBAI_LOCATION}.`,
    );
  }
  const locations = await listLocations();
  if (!(MUMBAI_LOCATION in locations)) {
    throw new Error(
      `Location ${MUMBAI_LOCATION} not offered. Available: ${Object.keys(locations).join(", ")}. Set TURSO_LOCATION.`,
    );
  }
  return createGroup(name, MUMBAI_LOCATION);
}
