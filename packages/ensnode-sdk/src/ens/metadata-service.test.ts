import { ENSNamespaceIds } from "@ensnode/datasources";
import { describe, expect, it } from "vitest";
import type { BrowserSupportedAssetUrlProxy } from "./metadata-service";
import { buildBrowserSupportedAvatarUrl } from "./metadata-service";

describe("buildBrowserSupportedAvatarUrl", () => {
  it("returns null browserSupportedAssetUrl when rawAssetTextRecord is null", () => {
    const result = buildBrowserSupportedAvatarUrl(null, "lightwalker.eth", ENSNamespaceIds.Mainnet);

    expect(result.rawAssetTextRecord).toBe(null);
    expect(result.browserSupportedAssetUrl).toBe(null);
    expect(result.usesProxy).toBe(false);
  });

  it("returns https URL directly without proxy", () => {
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

  it("returns http URL directly without proxy", () => {
    const httpUrl = "http://example.com/avatar.png";
    const result = buildBrowserSupportedAvatarUrl(
      httpUrl,
      "lightwalker.eth",
      ENSNamespaceIds.Mainnet,
    );

    expect(result.rawAssetTextRecord).toBe(httpUrl);
    expect(result.browserSupportedAssetUrl).not.toBe(null);
    expect(result.browserSupportedAssetUrl?.protocol).toBe("http:");
    expect(result.browserSupportedAssetUrl?.hostname).toBe("example.com");
    expect(result.browserSupportedAssetUrl?.pathname).toBe("/avatar.png");
    expect(result.usesProxy).toBe(false);
  });

  it("returns data URL with SVG directly without proxy", () => {
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

  it("returns data URL with PNG directly withotu proxy (ENSIP-12)", () => {
    const dataUrl =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
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

  it("returns data URL with JPG directly without proxy (ENSIP-12)", () => {
    const dataUrl =
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwABmQ//Z";
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

  it("routes IPFS URLs through proxy to ENS Metadata Service", () => {
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

  it("routes IPFS URLs through proxy (ENSIP-12 BAYC)", () => {
    const ipfsUrl = "ipfs://QmRRPWG96cmgTn2qSzjwr2qvfNEuhunv6FNeMFGa9bx6mQ";
    const result = buildBrowserSupportedAvatarUrl(
      ipfsUrl,
      "lightwalker.eth",
      ENSNamespaceIds.Mainnet,
    );

    expect(result.rawAssetTextRecord).toBe(ipfsUrl);
    expect(result.browserSupportedAssetUrl).not.toBe(null);
    expect(result.browserSupportedAssetUrl?.protocol).toBe("https:");
    expect(result.browserSupportedAssetUrl?.hostname).toBe("metadata.ens.domains");
    expect(result.usesProxy).toBe(true);
  });

  // TODO:
  it("routes CAIP-22 ERC-721 NFT URIs through proxy", () => {
    const nftUri = "eip155:1/erc721:0x06012c8cf97BEaD5deAe237070F9587f8E7A266d/771769";
    const ensName = "lightwalker.eth";
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

  it("routes CAIP-22 ERC-721 NFT URIs through proxy (ENSIP-12 BAYC example)", () => {
    const nftUri = "eip155:1/erc721:0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d/0";
    const result = buildBrowserSupportedAvatarUrl(
      nftUri,
      "lightwalker.eth",
      ENSNamespaceIds.Mainnet,
    );

    expect(result.rawAssetTextRecord).toBe(nftUri);
    expect(result.browserSupportedAssetUrl).not.toBe(null);
    expect(result.browserSupportedAssetUrl?.protocol).toBe("https:");
    expect(result.browserSupportedAssetUrl?.hostname).toBe("metadata.ens.domains");
    expect(result.usesProxy).toBe(true);
  });

  it("routes CAIP-29 ERC-1155 NFT URIs through proxy", () => {
    const nftUri = "eip155:1/erc1155:0xfaafdc07907ff5120a76b34b731b278c38d6043c/1";
    const result = buildBrowserSupportedAvatarUrl(
      nftUri,
      "lightwalker.eth",
      ENSNamespaceIds.Mainnet,
    );

    expect(result.rawAssetTextRecord).toBe(nftUri);
    expect(result.browserSupportedAssetUrl).not.toBe(null);
    expect(result.browserSupportedAssetUrl?.protocol).toBe("https:");
    expect(result.browserSupportedAssetUrl?.hostname).toBe("metadata.ens.domains");
    expect(result.usesProxy).toBe(true);
  });

  it("routes CAIP-22 NFT URI on Polygon through proxy", () => {
    const nftUri = "eip155:137/erc721:0x2953399124F0cBB46d2CbACD8A89cF0599974963/1";
    const result = buildBrowserSupportedAvatarUrl(
      nftUri,
      "lightwalker.eth",
      ENSNamespaceIds.Mainnet,
    );

    expect(result.rawAssetTextRecord).toBe(nftUri);
    expect(result.browserSupportedAssetUrl).not.toBe(null);
    expect(result.usesProxy).toBe(true);
  });

  it("returns null for malformed URL", () => {
    const malformedUrl = "not-a-valid-url";
    const result = buildBrowserSupportedAvatarUrl(
      malformedUrl,
      "lightwalker.eth",
      ENSNamespaceIds.Mainnet,
    );

    expect(result.rawAssetTextRecord).toBe(malformedUrl);
    expect(result.browserSupportedAssetUrl).toBe(null);
    expect(result.usesProxy).toBe(false);
  });

  it("returns null for empty string", () => {
    const emptyString = "";
    const result = buildBrowserSupportedAvatarUrl(
      emptyString,
      "lightwalker.eth",
      ENSNamespaceIds.Mainnet,
    );

    expect(result.rawAssetTextRecord).toBe(emptyString);
    expect(result.browserSupportedAssetUrl).toBe(null);
    expect(result.usesProxy).toBe(false);
  });

  // TODO: CAPI Formats
  it("returns null for invalid CAIP format (not eip155 namespace)", () => {
    const invalidCaip = "cosmos:cosmoshub-4/nft:0x123/1";
    const result = buildBrowserSupportedAvatarUrl(
      invalidCaip,
      "lightwalker.eth",
      ENSNamespaceIds.Mainnet,
    );

    expect(result.rawAssetTextRecord).toBe(invalidCaip);
    expect(result.browserSupportedAssetUrl).toBe(null);
    expect(result.usesProxy).toBe(false);
  });

  it("returns null for invalid NFT asset type (not erc721 or erc1155)", () => {
    const invalidAssetType = "eip155:1/erc20:0x123/1";
    const result = buildBrowserSupportedAvatarUrl(
      invalidAssetType,
      "lightwalker.eth",
      ENSNamespaceIds.Mainnet,
    );

    expect(result.rawAssetTextRecord).toBe(invalidAssetType);
    expect(result.browserSupportedAssetUrl).toBe(null);
    expect(result.usesProxy).toBe(false);
  });

  it("uses custom proxy for IPFS URLs", () => {
    const ipfsUrl = "ipfs://QmCustomHash123";
    const ensName = "lightwalker.eth";

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

  it("uses custom proxy for NFT URIs", () => {
    const nftUri = "eip155:1/erc721:0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d/0";
    const ensName = "lightwalker.eth";

    const customProxy: BrowserSupportedAssetUrlProxy = (name, assetUrl, namespaceId) => {
      expect(name).toBe(ensName);
      expect(assetUrl.protocol).toBe("eip155:");
      expect(namespaceId).toBe(ENSNamespaceIds.Mainnet);

      return new URL(`https://nft-proxy.example.com/${name}`);
    };

    const result = buildBrowserSupportedAvatarUrl(
      nftUri,
      ensName,
      ENSNamespaceIds.Mainnet,
      customProxy,
    );

    expect(result.rawAssetTextRecord).toBe(nftUri);
    expect(result.browserSupportedAssetUrl).not.toBe(null);
    expect(result.browserSupportedAssetUrl?.hostname).toBe("nft-proxy.example.com");
    expect(result.usesProxy).toBe(true);
  });

  // TODO: Non supported browser protocols to return null
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

    expect(result.rawAssetTextRecord).toBe(ipfsUrl);
    expect(result.browserSupportedAssetUrl).toBe(null);
    expect(result.usesProxy).toBe(false);
  });
});
