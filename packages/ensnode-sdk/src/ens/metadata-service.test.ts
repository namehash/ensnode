import { ENSNamespaceIds } from "@ensnode/datasources";
import { describe, expect, it } from "vitest";
import type { BrowserSupportedAssetUrlProxy } from "./metadata-service";
import { buildBrowserSupportedAvatarUrl } from "./metadata-service";

describe("buildBrowserSupportedAvatarUrl", () => {
  it("returns null when rawAssetTextRecord is null", () => {
    const result = buildBrowserSupportedAvatarUrl(null, "lightwalker.eth", ENSNamespaceIds.Mainnet);

    expect(result.rawAssetTextRecord).toBe(null);
    expect(result.browserSupportedAssetUrl).toBe(null);
    expect(result.usesProxy).toBe(false);
  });

  it("uses https URLs directly without proxy", () => {
    const httpsUrl = "https://example.com/avatar.png";
    const result = buildBrowserSupportedAvatarUrl(
      httpsUrl,
      "lightwalker.eth",
      ENSNamespaceIds.Mainnet,
    );

    expect(result.browserSupportedAssetUrl?.protocol).toBe("https:");
    expect(result.usesProxy).toBe(false);
  });

  it("uses http URLs directly without proxy", () => {
    const httpUrl = "http://example.com/avatar.png";
    const result = buildBrowserSupportedAvatarUrl(
      httpUrl,
      "lightwalker.eth",
      ENSNamespaceIds.Mainnet,
    );

    expect(result.browserSupportedAssetUrl?.protocol).toBe("http:");
    expect(result.usesProxy).toBe(false);
  });

  it("uses data URLs directly without proxy", () => {
    const dataUrl = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCI+PC9zdmc+";
    const result = buildBrowserSupportedAvatarUrl(
      dataUrl,
      "lightwalker.eth",
      ENSNamespaceIds.Mainnet,
    );

    expect(result.browserSupportedAssetUrl?.protocol).toBe("data:");
    expect(result.usesProxy).toBe(false);
  });

  it("uses proxy for IPFS URLs", () => {
    const ipfsUrl = "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
    const result = buildBrowserSupportedAvatarUrl(
      ipfsUrl,
      "lightwalker.eth",
      ENSNamespaceIds.Mainnet,
    );

    expect(result.browserSupportedAssetUrl?.protocol).toBe("https:");
    expect(result.browserSupportedAssetUrl?.hostname).toBe("metadata.ens.domains");
    expect(result.usesProxy).toBe(true);
  });

  it("uses proxy for CAIP-22 ERC-721 NFT URIs", () => {
    const nftUri = "eip155:1/erc721:0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d/0";
    const result = buildBrowserSupportedAvatarUrl(
      nftUri,
      "lightwalker.eth",
      ENSNamespaceIds.Mainnet,
    );

    expect(result.browserSupportedAssetUrl?.protocol).toBe("https:");
    expect(result.browserSupportedAssetUrl?.hostname).toBe("metadata.ens.domains");
    expect(result.usesProxy).toBe(true);
  });

  it("uses proxy for CAIP-29 ERC-1155 NFT URIs", () => {
    const nftUri = "eip155:1/erc1155:0xfaafdc07907ff5120a76b34b731b278c38d6043c/1";
    const result = buildBrowserSupportedAvatarUrl(
      nftUri,
      "lightwalker.eth",
      ENSNamespaceIds.Mainnet,
    );

    expect(result.browserSupportedAssetUrl?.protocol).toBe("https:");
    expect(result.usesProxy).toBe(true);
  });

  it("returns null for invaldi CAIP namespace (not eip155)", () => {
    const invalidCaip = "cosmos:cosmoshub-4/nft:0x123/1";
    const result = buildBrowserSupportedAvatarUrl(
      invalidCaip,
      "lightwalker.eth",
      ENSNamespaceIds.Mainnet,
    );

    expect(result.browserSupportedAssetUrl).toBe(null);
    expect(result.usesProxy).toBe(false);
  });

  it("returns null for invalid asset type (not erc721 or erc1155)", () => {
    const invalidAssetType = "eip155:1/erc20:0x123/1";
    const result = buildBrowserSupportedAvatarUrl(
      invalidAssetType,
      "lightwalker.eth",
      ENSNamespaceIds.Mainnet,
    );

    expect(result.browserSupportedAssetUrl).toBe(null);
    expect(result.usesProxy).toBe(false);
  });

  it("returns null for malformed URLs", () => {
    const malformedUrl = "not-a-valid-url";
    const result = buildBrowserSupportedAvatarUrl(
      malformedUrl,
      "lightwalker.eth",
      ENSNamespaceIds.Mainnet,
    );

    expect(result.browserSupportedAssetUrl).toBe(null);
    expect(result.usesProxy).toBe(false);
  });

  it("uses custom proxy when provided", () => {
    const ipfsUrl = "ipfs://QmCustomHash123";
    const customProxy: BrowserSupportedAssetUrlProxy = (name) => {
      return new URL(`https://my-custom-proxy.com/${name}/avatar`);
    };

    const result = buildBrowserSupportedAvatarUrl(
      ipfsUrl,
      "lightwalker.eth",
      ENSNamespaceIds.Mainnet,
      customProxy,
    );

    expect(result.browserSupportedAssetUrl?.hostname).toBe("my-custom-proxy.com");
    expect(result.usesProxy).toBe(true);
  });

  it("returns null when custom proxy returns non-browser-supported protocol", () => {
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

    expect(result.browserSupportedAssetUrl).toBe(null);
    expect(result.usesProxy).toBe(false);
  });
});
