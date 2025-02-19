import { anvil, base, holesky, linea, mainnet, sepolia } from "viem/chains";
import { describe, expect, it } from "vitest";

import { SupportedChainId, getBlockExplorerBlockUrl, getChainName } from "./chains";

describe("chains", () => {
  describe("getChainName", () => {
    it("should get chain name", () => {
      expect(getChainName(mainnet.id)).toBe(mainnet.name);
      expect(getChainName(holesky.id)).toBe(holesky.name);
      expect(getChainName(anvil.id)).toBe(anvil.name);
    });
  });

  describe("getBlockExplorerBlockUrl", () => {
    it("should get block explorer url for supported chains", () => {
      const supprotedChains = [
        [mainnet.id, mainnet.blockExplorers.default.url],
        [sepolia.id, sepolia.blockExplorers.default.url],
        [holesky.id, holesky.blockExplorers.default.url],
        [base.id, base.blockExplorers.default.url],
        [linea.id, linea.blockExplorers.default.url],
      ] as const;

      for (const [chainId, blockExplorerUrl] of supprotedChains) {
        const blockNumber = 1_001;
        expect(getBlockExplorerBlockUrl(chainId, blockNumber)).toBe(
          `${blockExplorerUrl}/block/${blockNumber}`,
        );
      }
    });

    it("should return null for unsupported chain", () => {
      const blockNumber = 1_001;
      expect(getBlockExplorerBlockUrl(anvil.id, blockNumber)).toBe(null);
      expect(getBlockExplorerBlockUrl(4321234 as SupportedChainId, blockNumber)).toBe(null);
    });
  });
});
