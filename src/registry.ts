const REGISTRY =
  process.env.INDUSMCP_REGISTRY ?? "https://indusmcp.vercel.app/api/v0";

export type EnvVar = {
  name: string;
  description?: string;
  isRequired?: boolean;
  isSecret?: boolean;
  default?: string;
};

export type PackageArg = {
  type: "named" | "positional";
  name?: string;
  valueHint?: string;
  description?: string;
  isRequired?: boolean;
  isRepeated?: boolean;
  default?: string;
};

export type Pkg = {
  registryType: string;
  identifier: string;
  version?: string;
  runtimeHint?: string;
  transport?: { type: string };
  environmentVariables?: EnvVar[];
  packageArguments?: PackageArg[];
};

export type ServerJson = {
  name: string;
  title?: string;
  description: string;
  version: string;
  packages?: Pkg[];
  remotes?: Array<{ type: string; url: string }>;
};

export type ServerRecord = { server: ServerJson; _meta?: unknown };

export async function fetchAll(query?: string): Promise<ServerRecord[]> {
  const url = new URL(`${REGISTRY}/servers`);
  if (query) url.searchParams.set("search", query);
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Registry returned ${res.status}`);
  const data = (await res.json()) as { servers: ServerRecord[] };
  return data.servers;
}

export async function fetchOne(name: string): Promise<ServerRecord | null> {
  const res = await fetch(`${REGISTRY}/servers/${name}`, {
    headers: { Accept: "application/json" },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Registry returned ${res.status}`);
  return (await res.json()) as ServerRecord;
}
