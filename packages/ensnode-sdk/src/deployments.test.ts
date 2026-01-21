import { describe, expect, it } from "vitest";

import {
  DEFAULT_ENSNODE_API_URL_MAINNET,
  DEFAULT_ENSNODE_API_URL_SEPOLIA,
  getDefaultEnsNodeUrl,
} from "./deployments";
import { ENSNamespaceIds } from "./ens";

describe("getDefaultEnsNodeUrl", () => {
  it("returns the mainnet default URL when no namespace is provided", () => {
    const url = getDefaultEnsNodeUrl();

    expect(url.href).toBe(`${DEFAULT_ENSNODE_API_URL_MAINNET}/`);
  });

  it("returns the mainnet default URL", () => {
    const url = getDefaultEnsNodeUrl(ENSNamespaceIds.Mainnet);

    expect(url.href).toBe(`${DEFAULT_ENSNODE_API_URL_MAINNET}/`);
  });

  it("returns the sepolia default URL", () => {
    const url = getDefaultEnsNodeUrl(ENSNamespaceIds.Sepolia);

    expect(url.href).toBe(`${DEFAULT_ENSNODE_API_URL_SEPOLIA}/`);
  });

  it("throws for unsupported namespaces", () => {
    const unsupportedNamespace = ENSNamespaceIds.EnsTestEnv;

    expect(() => getDefaultEnsNodeUrl(unsupportedNamespace)).toThrow(
      `ENSNamespaceId ${unsupportedNamespace} does not have a default ENSNode URL defined`,
    );
  });
});
