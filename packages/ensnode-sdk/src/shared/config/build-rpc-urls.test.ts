import { describe, expect, it } from "vitest";

import {
  type ENSNamespace,
  ENSNamespaceIds,
  ensTestEnvL1Chain,
  ensTestEnvL2Chain,
  getENSNamespace,
} from "@ensnode/datasources";

import { buildAlchemyUrl, buildDRPCUrl } from "./build-rpc-urls";

const KEY = "whatever";

const LOCAL_CHAIN_IDS = [ensTestEnvL1Chain.id, ensTestEnvL2Chain.id];
const ALL_KNOWN_PUBLIC_CHAIN_IDS = Object.values(ENSNamespaceIds)
  .map((namespace) => getENSNamespace(namespace))
  .flatMap((namespace: ENSNamespace) => Object.values(namespace))
  .map((datasource) => datasource.chain.id)
  .filter((chainId) => !LOCAL_CHAIN_IDS.includes(chainId));

describe("build-rpc-urls", () => {
  it("should build rpc urls for each known public chain id", () => {
    ALL_KNOWN_PUBLIC_CHAIN_IDS.forEach((chainId) => {
      expect(buildAlchemyUrl(chainId, KEY), `Alchemy ${chainId}`).not.toBeUndefined();
      expect(buildDRPCUrl(chainId, KEY), `DRPC ${chainId}`).not.toBeUndefined();
    });
  });
});
