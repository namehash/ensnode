import { buildAlchemyUrl, buildDRPCUrl } from "@/lib/build-rpc-urls";
import { getENSNamespaceAsFullyDefinedAtCompileTime } from "@/lib/plugin-helpers";
import { ENSNamespaceIds, ensTestEnvL1Chain, ensTestEnvL2Chain } from "@ensnode/datasources";
import { describe, expect, it } from "vitest";

const KEY = "whatever";

const LOCAL_CHAIN_IDS = [ensTestEnvL1Chain.id, ensTestEnvL2Chain.id];
const ALL_KNOWN_CHAIN_IDS = Object.values(ENSNamespaceIds)
  .map((namespace) => getENSNamespaceAsFullyDefinedAtCompileTime(namespace))
  .flatMap((namespace) => Object.values(namespace))
  .map((datasource) => datasource.chain.id)
  .filter((chainId) => !LOCAL_CHAIN_IDS.includes(chainId));

describe("build-rpc-urls", () => {
  it("should build rpc urls for each known chain id", () => {
    ALL_KNOWN_CHAIN_IDS.forEach((chainId) => {
      expect(buildAlchemyUrl(chainId, KEY), `Alchemy ${chainId}`).not.toBeUndefined();
      expect(buildDRPCUrl(chainId, KEY), `DRPC ${chainId}`).not.toBeUndefined();
    });
  });
});
