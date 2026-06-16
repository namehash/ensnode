import { ENSNamespaceIds } from "@ensnode/ensnode-sdk";
import { describe, expect, it } from "vitest";

import { DOCS_OMNIGRAPH_NAMESPACE_CONFIG } from "@lib/examples/omnigraph/constants";

import { getGraphqlApiExampleQueryById } from "@ensnode/ensnode-sdk/internal";

import {
  getOmnigraphExamplePageHref,
  OMNIGRAPH_EXAMPLES_CONFIG,
  OMNIGRAPH_EXAMPLES_SIDEBAR_ITEMS,
} from "./config";

const SEPOLIA_V2_ONLY_IDS = new Set([
  "registry-domains",
  "permissions-by-contract",
  "permissions-by-user",
  "account-resolver-permissions",
  "account-migrated-names",
  "eth-by-version",
  "domain-subdomains-recently-registered",
]);

describe("OMNIGRAPH_EXAMPLES_CONFIG", () => {
  it("assigns a supported docs namespace to every example", () => {
    for (const config of OMNIGRAPH_EXAMPLES_CONFIG) {
      expect(
        DOCS_OMNIGRAPH_NAMESPACE_CONFIG[config.namespace],
        `${config.id} namespace must be in DOCS_OMNIGRAPH_NAMESPACE_CONFIG`,
      ).toBeDefined();
    }
  });

  it("uses sepolia-v2 for ENSv2-heavy examples", () => {
    for (const id of SEPOLIA_V2_ONLY_IDS) {
      const config = OMNIGRAPH_EXAMPLES_CONFIG.find((entry) => entry.id === id);
      expect(config?.namespace).toBe(ENSNamespaceIds.SepoliaV2);
    }
  });

  it("uses mainnet for general examples", () => {
    for (const config of OMNIGRAPH_EXAMPLES_CONFIG) {
      if (SEPOLIA_V2_ONLY_IDS.has(config.id)) continue;
      expect(config.namespace).toBe(ENSNamespaceIds.Mainnet);
    }
  });

  it("has unique example ids", () => {
    const ids = OMNIGRAPH_EXAMPLES_CONFIG.map((config) => config.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("builds sidebar items in config order after the overview link", () => {
    const pageConfigs = OMNIGRAPH_EXAMPLES_CONFIG.filter((config) => config.hostSeparatePage);
    expect(OMNIGRAPH_EXAMPLES_SIDEBAR_ITEMS[0]).toEqual({
      label: "Overview",
      link: "/docs/integrate/omnigraph/examples",
    });
    expect(OMNIGRAPH_EXAMPLES_SIDEBAR_ITEMS.slice(1)).toEqual(
      pageConfigs.map((config) => ({
        label: getGraphqlApiExampleQueryById(config.id).title,
        link: getOmnigraphExamplePageHref(config),
      })),
    );
  });
});
