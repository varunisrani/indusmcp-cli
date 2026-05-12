import { spawnSync } from "node:child_process";
import kleur from "kleur";
import {
  claudeCodeAvailable,
  readConfig,
  type ClientId,
  type FileBackedClient,
} from "../clients.js";

export async function listCommand(opts: { client: ClientId }): Promise<void> {
  if (opts.client === "claude-code") {
    if (!claudeCodeAvailable()) {
      console.error(
        kleur.red("ERR"),
        "claude code CLI not found on PATH.",
      );
      process.exit(1);
    }
    spawnSync("claude", ["mcp", "list"], { stdio: "inherit" });
    return;
  }

  const client = opts.client as FileBackedClient;
  const config = readConfig(client);

  // indusagi uses an ARRAY of { name, command, args, ... }
  if (client === "indusagi") {
    const raw = config["servers"];
    const list: Array<Record<string, unknown>> = Array.isArray(raw)
      ? (raw as Array<Record<string, unknown>>)
      : [];
    if (list.length === 0) {
      console.log(kleur.dim(`No servers installed for indusagi.`));
      return;
    }
    console.log(kleur.bold(`Installed in indusagi:`));
    for (const entry of list) {
      const name = entry?.name as string | undefined;
      const enabled = entry?.enabled !== false;
      const marker = enabled ? "  -" : kleur.dim("  -");
      const suffix = enabled ? "" : kleur.dim(" (disabled)");
      console.log(`${marker} ${name ?? "<unnamed>"}${suffix}`);
    }
    return;
  }

  // claude / cursor / vscode use an OBJECT keyed by server name
  const key = client === "claude" ? "mcpServers" : "servers";
  const servers = (config[key] as Record<string, unknown>) ?? {};
  const names = Object.keys(servers);
  if (names.length === 0) {
    console.log(kleur.dim(`No servers installed for ${client}.`));
    return;
  }
  console.log(kleur.bold(`Installed in ${client}:`));
  for (const n of names) console.log(`  - ${n}`);
}
