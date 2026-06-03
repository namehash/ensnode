import { toNormalizedAddress } from "enssdk";
import { describe, expect, it } from "vitest";

import { identifyDatasourceContracts } from "./identify-contracts";

// The BaseRegistrar (mainnet ENSRoot, chainId 1), deployed via CREATE2 at the same address on sepolia.
const BASE_REGISTRAR = toNormalizedAddress("0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85");

describe("identifyDatasourceContracts", () => {
  it("identifies a well-known contract by address", () => {
    const matches = identifyDatasourceContracts("mainnet", { address: BASE_REGISTRAR });
    expect(matches).toContainEqual({
      namespace: "mainnet",
      datasource: "ensroot",
      contract: "BaseRegistrar",
      chainId: 1,
      address: BASE_REGISTRAR,
    });
  });

  it("matches regardless of input address checksum", () => {
    const checksummed = "0x57f1887A8Bf19b14fC0dF6Fd9B2acc9Af147eA85";
    const matches = identifyDatasourceContracts("mainnet", {
      address: toNormalizedAddress(checksummed),
    });
    expect(matches.length).toBeGreaterThan(0);
  });

  it("restricts to the given chainId", () => {
    const onChainOne = identifyDatasourceContracts("mainnet", {
      chainId: 1,
      address: BASE_REGISTRAR,
    });
    expect(onChainOne.length).toBeGreaterThan(0);

    const onWrongChain = identifyDatasourceContracts("mainnet", {
      chainId: 8453,
      address: BASE_REGISTRAR,
    });
    expect(onWrongChain).toEqual([]);
  });

  it("returns an empty array when nothing matches", () => {
    const matches = identifyDatasourceContracts("mainnet", {
      address: toNormalizedAddress("0x0000000000000000000000000000000000000000"),
    });
    expect(matches).toEqual([]);
  });
});
