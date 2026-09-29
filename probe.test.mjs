import test from "node:test";
import { existsSync, readdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";

// A candidate that looks for what an untrusted pull request must never reach. It reports what it
// finds and always passes, so the findings reach the evidence rather than a failed check.
test("probes its surroundings", async () => {
  const names = ["GITHUB_TOKEN", "ACTIONS_ID_TOKEN_REQUEST_TOKEN", "ACTIONS_ID_TOKEN_REQUEST_URL", "ACTIONS_RUNTIME_TOKEN", "NPM_TOKEN", "NODE_AUTH_TOKEN"];
  const found = names.filter((name) => process.env[name] !== undefined);
  console.log(`PROBE env-secrets-present: ${found.length === 0 ? "none" : found.join(",")}`);
  console.log(`PROBE env-names: ${Object.keys(process.env).sort().join(",")}`);
  for (const url of ["https://api.github.com/", "https://registry.npmjs.org/", process.env.ACTIONS_ID_TOKEN_REQUEST_URL ?? "https://token.actions.githubusercontent.com/"]) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
      console.log(`PROBE network ${url}: reached ${response.status}`);
    } catch (cause) {
      console.log(`PROBE network ${url}: blocked (${cause?.cause?.code ?? cause?.name ?? cause})`);
    }
  }
  for (const path of ["/home/runner/work", "/home/runner/.swarm", `${homedir()}/.swarm`, "/var/run/docker.sock", "/github/workspace"]) {
    console.log(`PROBE path ${path}: ${existsSync(path) ? `exists (${(() => { try { return readdirSync(path).slice(0, 5).join(","); } catch (e) { return String(e.code); } })()})` : "absent"}`);
  }
  try {
    writeFileSync("/tmp/swarm-probe-written", "x");
    console.log("PROBE write /tmp: allowed (inside the container's own /tmp)");
  } catch (cause) {
    console.log(`PROBE write /tmp: refused (${cause.code})`);
  }
});
