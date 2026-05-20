import { ensTestEnvChain } from "@ensnode/datasources";

import { seedDevnet } from "./seed/index";

const defaultRpcUrl = ensTestEnvChain.rpcUrls.default.http[0];
const rpcUrl = process.env.DEVNET_RPC_URL ?? defaultRpcUrl;

async function main() {
  console.log(`[seed:devnet] Seeding devnet at ${rpcUrl}...`);
  await seedDevnet(rpcUrl);
  console.log("[seed:devnet] Done");
}

main().catch((error: unknown) => {
  console.error("[seed:devnet] Failed:", error);
  process.exit(1);
});
