# indusmcp

Search and install MCP servers locally. Credentials stay on your machine.

```bash
npx indusmcp search filesystem
npx indusmcp install io.github.modelcontextprotocol/memory --client claude
npx indusmcp list --client claude
npx indusmcp doctor
```

Or install globally and call the binary directly:

```bash
npm install -g indusmcp
indusmcp search filesystem
```

Supported clients: `claude` (Claude Desktop), `cursor`, `vscode`.

## How it works

- Searches and reads server records from the IndusMCP registry (`https://indusmcp.vercel.app/api/v0`) over plain HTTP.
- For an `npm` server: writes `{ command: "npx", args: ["-y", <package>, ...args] }` into the client's config.
- For a `pypi` server: writes `{ command: "uvx", args: [<package>, ...args] }`.
- Prompts for any required `environmentVariables` and `packageArguments` declared in the server record.
- Existing config files are backed up to `~/.indusmcp/backups/` before write.

No telemetry. No login. No secrets sent to the registry.

## Point at a different registry

Set `INDUSMCP_REGISTRY` to override (e.g. for self-hosted mirrors or local development):

```bash
INDUSMCP_REGISTRY=http://localhost:3000/api/v0 npx indusmcp search memory
```

## Local development

```bash
pnpm install
pnpm dev -- search filesystem
pnpm build && node dist/index.js doctor
```

## License

MIT.
