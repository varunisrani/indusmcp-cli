import { homedir, platform } from "node:os";
import { dirname, join } from "node:path";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { execSync } from "node:child_process";

export type ClientId = "claude" | "claude-code" | "cursor" | "vscode";

export const ALL_CLIENTS: ClientId[] = [
  "claude",
  "claude-code",
  "cursor",
  "vscode",
];

// File-based clients write their MCP config to a known JSON file.
// claude-code uses its own CLI (`claude mcp add`) and doesn't have a single
// stable file we own — so it's handled separately in install/list commands.
export type FileBackedClient = "claude" | "cursor" | "vscode";

export function configPath(client: FileBackedClient): string {
  const home = homedir();
  const p = platform();
  switch (client) {
    case "claude":
      if (p === "darwin")
        return join(
          home,
          "Library",
          "Application Support",
          "Claude",
          "claude_desktop_config.json",
        );
      if (p === "win32")
        return join(
          process.env.APPDATA ?? home,
          "Claude",
          "claude_desktop_config.json",
        );
      return join(home, ".config", "Claude", "claude_desktop_config.json");
    case "cursor":
      return join(home, ".cursor", "mcp.json");
    case "vscode":
      return join(home, ".vscode", "mcp.json");
  }
}

export function readConfig(client: FileBackedClient): Record<string, unknown> {
  const p = configPath(client);
  if (!existsSync(p)) return {};
  try {
    return JSON.parse(readFileSync(p, "utf8")) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function writeConfig(
  client: FileBackedClient,
  data: Record<string, unknown>,
): void {
  const p = configPath(client);
  const dir = dirname(p);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  if (existsSync(p)) {
    const backupDir = join(homedir(), ".indusmcp", "backups");
    mkdirSync(backupDir, { recursive: true });
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    writeFileSync(join(backupDir, `${client}-${ts}.json`), readFileSync(p));
  }

  writeFileSync(p, JSON.stringify(data, null, 2));
}

export function claudeCodeAvailable(): boolean {
  try {
    execSync("command -v claude", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}
