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
