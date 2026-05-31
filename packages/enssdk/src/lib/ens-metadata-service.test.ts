import { asInterpretedName } from "enssdk";
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
});

describe("getEnsMetadataServiceAvatarUrl", () => {
  it("delegates to the avatar image endpoint", () => {
    const name = asInterpretedName("test.eth");
    expect(getEnsMetadataServiceAvatarUrl(name, "mainnet")?.href).toBe(
      "https://metadata.ens.domains/mainnet/avatar/test.eth",
    );
  });
});
