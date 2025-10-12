import { describe, expect, it } from "vitest";

import { Address, isAddress } from "viem";
import { ContractConfig, ENSNamespaceIds, getENSNamespace } from "./index";

describe("datasource invariants", () => {
  Object.values(ENSNamespaceIds).forEach((namespace) => {
    it(`ENSNamespace '${namespace}' should have valid addresses for all contracts`, () => {
      for (const [datasourceName, datasource] of Object.entries(getENSNamespace(namespace))) {
        for (const [contractName, contractConfig] of Object.entries(datasource.contracts) as [
          string,
          ContractConfig,
        ][]) {
          // only ContractConfigs with `address` defined
          if ("address" in contractConfig && typeof contractConfig.address === "string") {
            // must be a valid `Address`
            expect(
              isAddress(contractConfig.address as Address, { strict: false }),
              `The ContractConfig '${namespace}' > '${datasourceName}' > '${contractName}' > '${contractConfig.address}' is not a viem#Address. This occurs if the address property of any ContractConfig in the Datasource is malformed (i.e. not a viem#Address).`,
            ).toBe(true);

            // must be lowercase adddress
            expect(
              contractConfig.address === contractConfig.address.toLowerCase(),
              `The ContractConfig '${namespace}' > '${datasourceName}' > '${contractName}' > '${contractConfig.address}' is not is lowercase format.`,
            ).toBe(true);
          }
        }
      }
    });
  });
});
