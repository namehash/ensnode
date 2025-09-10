import { describe, expect, it } from "vitest";

import { DatasourceNames, ENSNamespaceIds, getDatasource } from "@ensnode/datasources";
import { getSupportedNFTIssuer } from "../src/lib/tokenscope/nft-issuers";

const {
  contracts: { NameWrapper },
} = getDatasource(ENSNamespaceIds.Mainnet, DatasourceNames.ENSRoot);

describe("supported-nft-issuers", () => {
  it("works for expected mainnet contract", () => {
    const issuer = getSupportedNFTIssuer(ENSNamespaceIds.Mainnet, {
      chainId: 1,
      address: NameWrapper.address,
    });

    expect(issuer).toBeDefined();
  });
});
