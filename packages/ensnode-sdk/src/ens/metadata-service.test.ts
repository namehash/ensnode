import { ENSNamespaceIds } from "@ensnode/datasources";
import { describe, expect, it } from "vitest";
import type { BrowserSupportedAssetUrlProxy } from "./metadata-service";
import { buildBrowserSupportedAvatarUrl } from "./metadata-service";

describe("buildBrowserSupportedAvatarUrl", () => {
  describe("nulll rawAssetTextRecord implies null browserSupportedAssetUrl", () => {
    it("returns null browserSupportedAssetUrl when rawAssetTextRecord is null", () => {
      const result = buildBrowserSupportedAvatarUrl(null, "vitalik.eth", ENSNamespaceIds.Mainnet);

      expect(result.rawAssetTextRecord).toBe(null);
      expect(result.browserSupportedAssetUrl).toBe(null);
      expect(result.usesProxy).toBe(false);
    });
  });

  describe("URL construction: browser-supported protocols used directly", () => {
    it("returns https URL directly without proxy when rawAssetTextRecord uses https protocol", () => {
      const httpsUrl = "https://example.com/avatar.png";
      const result = buildBrowserSupportedAvatarUrl(
        httpsUrl,
        "lightwalker.eth",
        ENSNamespaceIds.Mainnet,
      );

      expect(result.rawAssetTextRecord).toBe(httpsUrl);
      expect(result.browserSupportedAssetUrl).not.toBe(null);
      expect(result.browserSupportedAssetUrl?.protocol).toBe("https:");
      expect(result.browserSupportedAssetUrl?.hostname).toBe("example.com");
      expect(result.browserSupportedAssetUrl?.pathname).toBe("/avatar.png");
      expect(result.usesProxy).toBe(false);
    });

    it("returns data URL directly without proxy when rawAssetTextRecord uses data protocol", () => {
      const dataUrl = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCI+PC9zdmc+";
      const result = buildBrowserSupportedAvatarUrl(
        dataUrl,
        "lightwalker.eth",
        ENSNamespaceIds.Mainnet,
      );

      expect(result.rawAssetTextRecord).toBe(dataUrl);
      expect(result.browserSupportedAssetUrl).not.toBe(null);
      expect(result.browserSupportedAssetUrl?.protocol).toBe("data:");
      expect(result.usesProxy).toBe(false);
    });
  });

  describe("URL construction for IPFS protocol requires proxy", () => {
    it("routes IPFS URLs through default proxy and constructs correct ENS Metadata Service URL", () => {
      const ipfsUrl = "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
      const ensName = "lightwalker.eth";
      const result = buildBrowserSupportedAvatarUrl(ipfsUrl, ensName, ENSNamespaceIds.Mainnet);

      expect(result.rawAssetTextRecord).toBe(ipfsUrl);
      expect(result.browserSupportedAssetUrl).not.toBe(null);
      expect(result.browserSupportedAssetUrl?.protocol).toBe("https:");
      expect(result.browserSupportedAssetUrl?.hostname).toBe("metadata.ens.domains");
      expect(result.browserSupportedAssetUrl?.pathname).toBe(
        `/mainnet/avatar/${encodeURIComponent(ensName)}`,
      );
      expect(result.usesProxy).toBe(true);
    });
  });

  describe("URL construction (eip155) require proxy", () => {
    it("routes CAIP-22 ERC-721 NFT URIs through proxy with correct URL construction", () => {
      // CAIP-22: ERC-721 NFT URI format

      const nftUri = "eip155:1/erc721:0x06012c8cf97BEaD5deAe237070F9587f8E7A266d/771769";

      const ensName = "nft.eth";

      const result = buildBrowserSupportedAvatarUrl(nftUri, ensName, ENSNamespaceIds.Sepolia);

      expect(result.rawAssetTextRecord).toBe(nftUri);

      expect(result.browserSupportedAssetUrl).not.toBe(null);

      expect(result.browserSupportedAssetUrl?.protocol).toBe("https:");

      expect(result.browserSupportedAssetUrl?.hostname).toBe("metadata.ens.domains");
      expect(result.browserSupportedAssetUrl?.pathname).toBe(
        `/sepolia/avatar/${encodeURIComponent(ensName)}`,
      );
      expect(result.usesProxy).toBe(true);
    });
  });

  describe("custom proxy overrides default", () => {
    it("uses custom proxy when provided and validates returned URL has browser-supported protocol", () => {
      const ipfsUrl = "ipfs://QmCustomHash123";
      const ensName = "lightwalker.eth";

      // Custom proxy that returns a different HTTPS URL
      const customProxy: BrowserSupportedAssetUrlProxy = (name, assetUrl, namespaceId) => {
        expect(name).toBe(ensName);
        expect(assetUrl.protocol).toBe("ipfs:");
        expect(namespaceId).toBe(ENSNamespaceIds.Mainnet);

        return new URL(`https://my-custom-proxy.com/${name}/avatar`);
      };

      const result = buildBrowserSupportedAvatarUrl(
        ipfsUrl,
        ensName,
        ENSNamespaceIds.Mainnet,
        customProxy,
      );

      expect(result.rawAssetTextRecord).toBe(ipfsUrl);
      expect(result.browserSupportedAssetUrl).not.toBe(null);
      expect(result.browserSupportedAssetUrl?.hostname).toBe("my-custom-proxy.com");
      expect(result.browserSupportedAssetUrl?.pathname).toBe(`/${ensName}/avatar`);
      expect(result.usesProxy).toBe(true);
    });

    it("throws error when custom proxy returns URL with non-browser-supported protocol", () => {
      const ipfsUrl = "ipfs://QmHash";

      const badProxy: BrowserSupportedAssetUrlProxy = () => {
        return new URL("ftp://bad-proxy.com/avatar.png");
      };

      const result = buildBrowserSupportedAvatarUrl(
        ipfsUrl,
        "lightwalker.eth",
        ENSNamespaceIds.Mainnet,
        badProxy,
      );

      // Should catch the error
      // 2. and return null browserSupportedAssetUrl

      expect(result.rawAssetTextRecord).toBe(ipfsUrl);
      expect(result.browserSupportedAssetUrl).toBe(null);
      expect(result.usesProxy).toBe(false);
    });
  });
});
