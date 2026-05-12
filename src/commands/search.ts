import kleur from "kleur";
import { fetchAll } from "../registry.js";

export async function searchCommand(query: string): Promise<void> {
  const results = await fetchAll(query);
  if (results.length === 0) {
    console.log(kleur.yellow("No matches."));
    return;
  }
  for (const { server } of results) {
    console.log(kleur.bold(server.title ?? server.name));
    console.log(kleur.dim(`  ${server.name}  v${server.version}`));
    console.log(`  ${server.description}`);
    console.log();
  }
}
