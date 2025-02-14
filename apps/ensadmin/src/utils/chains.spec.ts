import { anvil, base, holesky, linea, mainnet, sepolia } from "viem/chains";
import { describe, expect, it } from "vitest";
import { SupportedChainId, getBlockExplorerUrl, getChainName } from "./chains";

describe("chains", () => {
  const randomBlockNumber = () => getRandomArbitrary(1_000, 10_000);
  describe("getChainName", () => {
    it("should get chain name", () => {
      expect(getChainName(mainnet.id)).toBe(mainnet.name);
      expect(getChainName(holesky.id)).toBe(holesky.name);
      expect(getChainName(anvil.id)).toBe(anvil.name);
    });
  });

  describe("getBlockExplorerUrl", () => {
    it("should get block explorer url for supported chains", () => {
      const supprotedChains = [
        [mainnet.id, mainnet.blockExplorers.default.url],
        [sepolia.id, sepolia.blockExplorers.default.url],
        [holesky.id, holesky.blockExplorers.default.url],
        [base.id, base.blockExplorers.default.url],
        [linea.id, linea.blockExplorers.default.url],
      ] as const;

      for (const [chainId, blockExplorerUrl] of supprotedChains) {
        const blockNumber = randomBlockNumber();
        expect(getBlockExplorerUrl(chainId, blockNumber)).toBe(
          `${blockExplorerUrl}/block/${blockNumber}`,
        );
      }
    });

    it("should return null for unsupported chain", () => {
      const blockNumber = randomBlockNumber();
      expect(getBlockExplorerUrl(anvil.id, blockNumber)).toBe(null);
      expect(getBlockExplorerUrl(4321234 as SupportedChainId, blockNumber)).toBe(null);
    });
  });
});

function getRandomArbitrary(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}
