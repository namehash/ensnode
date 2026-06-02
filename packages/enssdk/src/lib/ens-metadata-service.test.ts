import { asInterpretedName, type Name } from "enssdk";
import { describe, expect, it } from "vitest";

import {
  getEnsMetadataServiceAvatarUrl,
  getEnsMetadataServiceImageUrl,
} from "./ens-metadata-service";

describe("getEnsMetadataServiceImageUrl", () => {
  const name = asInterpretedName("vitalik.eth");

  it("returns a sepolia header URL", () => {
    expect(getEnsMetadataServiceImageUrl(name, "sepolia", "header")?.href).toBe(
      "https://metadata.ens.domains/sepolia/header/vitalik.eth",
    );
  });

  it("returns null for unsupported namespaces", () => {
    expect(getEnsMetadataServiceImageUrl(name, "ens-test-env", "avatar")).toBeNull();
    expect(getEnsMetadataServiceImageUrl(name, "sepolia-v2", "avatar")).toBeNull();
  });

  it.each([
    ["absolute https URL", "https://evil.example/avatar.png"],
    ["absolute http URL", "http://evil.example/avatar.png"],
    ["protocol-relative URL", "//evil.example/avatar.png"],
    ["custom scheme", "javascript:alert(1)"],
  ])("returns null for non-name input: %s", (_message, maliciousName) => {
    expect(getEnsMetadataServiceImageUrl(maliciousName as Name, "mainnet", "avatar")).toBeNull();
  });
});

describe("getEnsMetadataServiceAvatarUrl", () => {
  it("delegates to the avatar image endpoint", () => {
    const name = asInterpretedName("test.eth");
    expect(getEnsMetadataServiceAvatarUrl(name, "mainnet")?.href).toBe(
      "https://metadata.ens.domains/mainnet/avatar/test.eth",
    );
  });
});
