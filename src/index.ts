#!/usr/bin/env node
import { Command } from "commander";
import kleur from "kleur";
import { searchCommand } from "./commands/search.js";
import { installCommand } from "./commands/install.js";
import { listCommand } from "./commands/list.js";
import { doctorCommand } from "./commands/doctor.js";

const program = new Command();

program
  .name("indusmcp")
  .description(
    "Search and install MCP servers locally. Credentials stay on your machine.",
  )
  .version("0.1.6");

program
  .command("search <query>")
  .description("Search the IndusMCP registry")
  .action(searchCommand);

program
  .command("install <name>")
  .description("Install a server into a local MCP client")
  .option("--client <client>", "claude | claude-code | cursor | vscode | indusagi", "claude")
  .action(installCommand);

program
  .command("list")
  .description("List installed servers for a client")
  .option("--client <client>", "claude | claude-code | cursor | vscode | indusagi", "claude")
  .action(listCommand);

program
  .command("doctor")
  .description("Check the local setup")
  .action(doctorCommand);

program.parseAsync().catch((err) => {
  const msg = err instanceof Error ? err.message : String(err);
  const cause =
    err instanceof Error && err.cause instanceof Error
      ? err.cause.message
      : undefined;
  console.error(kleur.red("ERR"), msg + (cause ? ` (cause: ${cause})` : ""));
  if (msg.toLowerCase().includes("fetch failed")) {
    const reg =
      process.env.INDUSMCP_REGISTRY ?? "https://indusmcp.vercel.app/api/v0";
    console.error(kleur.dim(`     registry: ${reg}`));
    console.error(
      kleur.dim(
        "     hint: is the registry running and reachable? try `curl -v " +
          reg +
          "/servers`",
      ),
    );
  }
  process.exit(1);
});
