import { describe, expect, it } from "vitest";

import {
  EMPTY_CHAIN_IDS_MESSAGE,
  validatePrimaryNamesChainIds,
} from "@/omnigraph-api/lib/validate-primary-names-chain-ids";

describe("validatePrimaryNamesChainIds", () => {
  it.each([
    { chainIds: undefined, label: "omitted" },
    { chainIds: null, label: "null" },
    { chainIds: [1], label: "single chain" },
    { chainIds: [1, 10], label: "multiple chains" },
  ])("allows $label", ({ chainIds }) => {
    expect(() => validatePrimaryNamesChainIds(chainIds)).not.toThrow();
  });

  it("rejects empty chainIds", () => {
    expect(() => validatePrimaryNamesChainIds([])).toThrow(EMPTY_CHAIN_IDS_MESSAGE);
  });
});
