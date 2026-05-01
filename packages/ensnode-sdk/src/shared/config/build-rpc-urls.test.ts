import type { ChainId } from "enssdk";
import { lineaSepolia } from "viem/chains";
import { describe, expect, it } from "vitest";

import {
  type ENSNamespace,
  ENSNamespaceIds,
  ensTestEnvChain,
  getENSNamespace,
  sepoliaV2Chain,
} from "@ensnode/datasources";

import { buildAlchemyBaseUrl, buildDRPCUrl, buildQuickNodeURL } from "./build-rpc-urls";

const KEY = "whatever";

const CHAINS_WITHOUT_AUTO_RPC_SUPPORT: ChainId[] = [ensTestEnvChain.id, sepoliaV2Chain.id];
const ALL_KNOWN_PUBLIC_CHAIN_IDS = Object.values(ENSNamespaceIds)
  .map((namespace) => getENSNamespace(namespace))
  .flatMap((namespace: ENSNamespace) => Object.values(namespace))
  .map((datasource) => datasource.chain.id)
  .filter((chainId) => !CHAINS_WITHOUT_AUTO_RPC_SUPPORT.includes(chainId));

describe("build-rpc-urls", () => {
  it("should build rpc urls for each known public chain id", () => {
    ALL_KNOWN_PUBLIC_CHAIN_IDS.forEach((chainId) => {
      expect(buildAlchemyBaseUrl(chainId, KEY), `Alchemy ${chainId}`).not.toBeUndefined();

      if (chainId !== lineaSepolia.id) {
        // QuickNode does not support Linea Sepolia RPC (as of 2025-12-03).
        expect(
          buildQuickNodeURL(chainId, KEY, "endpoint-name"),
          `QuickNode ${chainId}`,
        ).not.toBeUndefined();
      }

      expect(buildDRPCUrl(chainId, KEY), `dRPC ${chainId}`).not.toBeUndefined();
    });
  });
});
