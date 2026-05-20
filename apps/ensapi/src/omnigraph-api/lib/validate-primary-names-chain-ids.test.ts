import { DEFAULT_EVM_CHAIN_ID } from "enssdk";
import { describe, expect, it } from "vitest";

import {
  DEFAULT_CHAIN_ID_WITH_OTHERS_MESSAGE,
  EMPTY_CHAIN_IDS_MESSAGE,
  validatePrimaryNamesChainIds,
} from "@/omnigraph-api/lib/validate-primary-names-chain-ids";

describe("validatePrimaryNamesChainIds", () => {
  it.each([
    { chainIds: undefined, label: "omitted" },
    { chainIds: null, label: "null" },
    { chainIds: [1], label: "single chain" },
    { chainIds: [1, 10], label: "multiple chains" },
    { chainIds: [DEFAULT_EVM_CHAIN_ID], label: "default chain only" },
  ])("allows $label", ({ chainIds }) => {
    expect(() => validatePrimaryNamesChainIds(chainIds)).not.toThrow();
  });

  it("rejects empty chainIds", () => {
    expect(() => validatePrimaryNamesChainIds([])).toThrow(EMPTY_CHAIN_IDS_MESSAGE);
  });

  it("rejects default chain id combined with other chain ids", () => {
    expect(() => validatePrimaryNamesChainIds([DEFAULT_EVM_CHAIN_ID, 1])).toThrow(
      DEFAULT_CHAIN_ID_WITH_OTHERS_MESSAGE,
    );
  });
});
