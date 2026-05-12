import { spawnSync } from "node:child_process";
import kleur from "kleur";
import prompts from "prompts";
import {
  fetchOne,
  type PackageArg,
  type Pkg,
  type ServerJson,
} from "../registry.js";
import {
  claudeCodeAvailable,
  readConfig,
  writeConfig,
  type ClientId,
  type FileBackedClient,
} from "../clients.js";

type Opts = { client: ClientId };

export async function installCommand(name: string, opts: Opts): Promise<void> {
  const record = await fetchOne(name);
  if (!record) {
    console.error(kleur.red("ERR"), `Server not found: ${name}`);
    process.exit(1);
  }
  const server = record.server;
  console.log(kleur.bold(`Installing ${server.title ?? server.name}`));
  console.log(kleur.dim(`  ${server.description}`));
  console.log();

  const pkg = server.packages?.[0];
  if (!pkg) {
    console.error(
      kleur.red("ERR"),
      "Only package-based servers are supported in v0.1 (remote-only servers are coming).",
    );
    process.exit(1);
  }

  const env: Record<string, string> = {};
  for (const v of pkg.environmentVariables ?? []) {
    const answer = await prompts({
      type: "text",
      name: "value",
      message: v.description ?? v.name,
      initial: v.default ?? "",
      validate: (val: string) =>
        v.isRequired && !val ? "Required" : true,
    });
    const val = ((answer.value as string | undefined) ?? "").trim();
    if (val) env[v.name] = val;
  }

  const extraArgs = await collectPackageArgs(pkg.packageArguments ?? []);

  const entry = buildClientEntry(server, extraArgs);
  const slug = (server.title ?? server.name).split("/").pop() ?? server.name;

  if (opts.client === "claude-code") {
    installIntoClaudeCode(slug, entry, env);
    return;
  }

  installIntoFileClient(opts.client, slug, entry, env);
}

function installIntoFileClient(
  client: FileBackedClient,
  slug: string,
  entry: { command: string; args: string[] },
  env: Record<string, string>,
): void {
  const config = readConfig(client);
  const key = client === "claude" ? "mcpServers" : "servers";
  const existing = (config[key] as Record<string, unknown>) ?? {};
  existing[slug] = {
    ...entry,
    env: Object.keys(env).length ? env : undefined,
  };
  config[key] = existing;
  writeConfig(client, config);

  console.log(kleur.green("OK"), `Installed into ${client}.`);
  console.log(kleur.dim(`  Backup saved to ~/.indusmcp/backups/`));
  console.log(
    kleur.dim(
      `  Restart ${client === "claude" ? "Claude Desktop" : client} to load.`,
    ),
  );
}

function installIntoClaudeCode(
  slug: string,
  entry: { command: string; args: string[] },
  env: Record<string, string>,
): void {
  if (!claudeCodeAvailable()) {
    console.error(
      kleur.red("ERR"),
      "claude code CLI not found on PATH. Install it from https://www.npmjs.com/package/@anthropic-ai/claude-code",
    );
    process.exit(1);
  }

  // claude mcp add <name> [-s user] [-e K=V ...] -- <command> [args...]
  const args = ["mcp", "add", slug, "-s", "user"];
  for (const [k, v] of Object.entries(env)) {
    args.push("-e", `${k}=${v}`);
  }
  args.push("--", entry.command, ...entry.args);

  const result = spawnSync("claude", args, { stdio: "inherit" });
  if (result.status !== 0) {
    console.error(
      kleur.red("ERR"),
      `claude mcp add failed (exit ${result.status ?? "unknown"})`,
    );
    process.exit(1);
  }
  console.log(kleur.green("OK"), `Installed into claude-code (user scope).`);
  console.log(
    kleur.dim(`  Available in every project you open with claude code.`),
  );
}

async function collectPackageArgs(args: PackageArg[]): Promise<string[]> {
  const out: string[] = [];
  for (const a of args) {
    const label =
      a.description ??
      (a.type === "named"
        ? `Value for ${a.name ?? "argument"}`
        : `Positional value ${a.valueHint ? `(${a.valueHint})` : ""}`);
    const hint = a.isRepeated ? " (comma-separated for multiple)" : "";
    const answer = await prompts({
      type: "text",
      name: "value",
      message: `${label}${hint}`,
      initial: a.default ?? "",
      validate: (val: string) =>
        a.isRequired && !val ? "Required" : true,
    });
    const raw = ((answer.value as string | undefined) ?? "").trim();
    if (!raw) continue;

    const values = a.isRepeated
      ? raw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [raw];

    if (a.type === "named") {
      const flag = a.name
        ? a.name.startsWith("-")
          ? a.name
          : `--${a.name}`
        : "";
      if (!flag) continue;
      for (const v of values) out.push(flag, v);
    } else {
      out.push(...values);
    }
  }
  return out;
}

function buildClientEntry(
  server: ServerJson,
  extraArgs: string[],
): { command: string; args: string[] } {
  const pkg = server.packages?.[0] as Pkg | undefined;
  if (!pkg) throw new Error("No package metadata");
  if (pkg.registryType === "npm") {
    return {
      command: pkg.runtimeHint ?? "npx",
      args: ["-y", pkg.identifier, ...extraArgs],
    };
  }
  if (pkg.registryType === "pypi") {
    return {
      command: pkg.runtimeHint ?? "uvx",
      args: [pkg.identifier, ...extraArgs],
    };
  }
  throw new Error(`Unsupported registryType: ${pkg.registryType}`);
}
