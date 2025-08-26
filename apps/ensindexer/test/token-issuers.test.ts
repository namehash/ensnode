import { describe, expect, it } from "vitest";

import { DatasourceNames, ENSNamespaceIds, getDatasource } from "@ensnode/datasources";
import { getKnownTokenIssuer } from "../src/lib/tokenscope/token-issuers";

const {
  contracts: { NameWrapper },
} = getDatasource(ENSNamespaceIds.Mainnet, DatasourceNames.ENSRoot);

describe("token-issuers", () => {
  it("works for expected mainnet contract", () => {
    const issuer = getKnownTokenIssuer(ENSNamespaceIds.Mainnet, {
      chainId: 1,
      address: NameWrapper.address,
    });

    expect(issuer).toBeDefined();
  });
});
