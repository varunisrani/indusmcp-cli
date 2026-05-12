import kleur from "kleur";
import { existsSync } from "node:fs";
import { claudeCodeAvailable, configPath } from "../clients.js";

export async function doctorCommand(): Promise<void> {
  console.log(kleur.bold("IndusMCP Doctor"));
  console.log();

  const major = parseInt(process.versions.node.split(".")[0] ?? "0", 10);
  const nodeOk = major >= 20;
  console.log(
    `Node ${nodeOk ? kleur.green("OK") : kleur.red("ERR")} ${process.version}`,
  );

  for (const client of [
    "claude",
    "cursor",
    "vscode",
    "indusagi",
  ] as const) {
    const p = configPath(client);
    console.log(
      `${client}: ${existsSync(p) ? kleur.green("found") : kleur.dim("not found")} (${p})`,
    );
  }

  // claude-code is detected by the `claude` binary being on PATH, not a file.
  console.log(
    `claude-code: ${
      claudeCodeAvailable()
        ? kleur.green("found")
        : kleur.dim("not found")
    } (CLI on PATH)`,
  );

  console.log();
  console.log(
    kleur.dim(
      `Registry: ${process.env.INDUSMCP_REGISTRY ?? "https://indusmcp.vercel.app/api/v0"}`,
    ),
  );
}
