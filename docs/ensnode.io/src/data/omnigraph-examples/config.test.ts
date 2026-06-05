import { ENSNamespaceIds } from "@ensnode/ensnode-sdk";
import { describe, expect, it } from "vitest";

import { DOCS_OMNIGRAPH_NAMESPACE_CONFIG } from "@lib/examples/omnigraph/constants";

import { OMNIGRAPH_EXAMPLES_CONFIG } from "./config";

const SEPOLIA_V2_ONLY_IDS = new Set([
  "registry-domains",
  "permissions-by-contract",
  "permissions-by-user",
  "account-resolver-permissions",
  "account-migrated-names",
  "eth-by-version",
]);

describe("OMNIGRAPH_EXAMPLES_CONFIG", () => {
  it("assigns a supported docs namespace to every example", () => {
    for (const [id, config] of Object.entries(OMNIGRAPH_EXAMPLES_CONFIG)) {
      expect(
        DOCS_OMNIGRAPH_NAMESPACE_CONFIG[config.namespace],
        `${id} namespace must be in DOCS_OMNIGRAPH_NAMESPACE_CONFIG`,
      ).toBeDefined();
    }
  });

  it("uses sepolia-v2 for ENSv2-heavy examples", () => {
    for (const id of SEPOLIA_V2_ONLY_IDS) {
      expect(OMNIGRAPH_EXAMPLES_CONFIG[id]?.namespace).toBe(ENSNamespaceIds.SepoliaV2);
    }
  });

  it("uses mainnet for general examples", () => {
    const mainnetIds = Object.keys(OMNIGRAPH_EXAMPLES_CONFIG).filter(
      (id) => !SEPOLIA_V2_ONLY_IDS.has(id),
    );
    for (const id of mainnetIds) {
      expect(OMNIGRAPH_EXAMPLES_CONFIG[id]?.namespace).toBe(ENSNamespaceIds.Mainnet);
    }
  });
});
