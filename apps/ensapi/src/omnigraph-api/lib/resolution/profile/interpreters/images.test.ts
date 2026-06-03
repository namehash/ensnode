import { describe, expect, it, vi } from "vitest";

import { ProfileAvatarInterpreter, ProfileHeaderInterpreter } from "./images";
import { profileRecordsModel } from "./test-helpers";

vi.mock("@/di", () => ({
  default: {
    context: {
      namespace: "sepolia",
    },
  },
}));

describe("ProfileAvatarInterpreter", () => {
  it("has correct selection", () => {
    expect(ProfileAvatarInterpreter.selection).toEqual({ texts: ["avatar"] });
  });

  it.each([
    [
      "direct https URL",
      { avatar: "https://example.com/avatar.png" },
      { httpUrl: "https://example.com/avatar.png" },
    ],
    [
      "direct http URL",
      { avatar: "http://example.com/avatar.png" },
      { httpUrl: "http://example.com/avatar.png" },
    ],
    [
      "metadata service fallback for ipfs URL",
      { avatar: "ipfs://QmAvatar" },
      { httpUrl: "https://metadata.ens.domains/sepolia/avatar/test.eth" },
    ],
    [
      "metadata service fallback for non-http raw value",
      { avatar: "not-a-url" },
      { httpUrl: "https://metadata.ens.domains/sepolia/avatar/test.eth" },
    ],
  ])("parses %s", (_message, texts, expected) => {
    expect(ProfileAvatarInterpreter.interpret(profileRecordsModel(texts))).toEqual(expected);
  });

  it.each([
    ["record unset", {}],
    ["empty string", { avatar: "" }],
  ])("returns null: %s", (_message, texts) => {
    expect(ProfileAvatarInterpreter.interpret(profileRecordsModel(texts))).toBeNull();
  });
});

describe("ProfileHeaderInterpreter", () => {
  it("has correct selection", () => {
    expect(ProfileHeaderInterpreter.selection).toEqual({ texts: ["header"] });
  });

  it.each([
    [
      "direct https URL",
      { header: "https://example.com/header.png" },
      { httpUrl: "https://example.com/header.png" },
    ],
    [
      "direct http URL",
      { header: "http://example.com/header.png" },
      { httpUrl: "http://example.com/header.png" },
    ],
    [
      "metadata service fallback for ipfs URL",
      { header: "ipfs://QmHeader" },
      { httpUrl: "https://metadata.ens.domains/sepolia/header/test.eth" },
    ],
    [
      "metadata service fallback for non-http raw value",
      { header: "not-a-url" },
      { httpUrl: "https://metadata.ens.domains/sepolia/header/test.eth" },
    ],
  ])("parses %s", (_message, texts, expected) => {
    expect(ProfileHeaderInterpreter.interpret(profileRecordsModel(texts))).toEqual(expected);
  });

  it.each([
    ["record unset", {}],
    ["empty string", { header: "" }],
  ])("returns null: %s", (_message, texts) => {
    expect(ProfileHeaderInterpreter.interpret(profileRecordsModel(texts))).toBeNull();
  });
});
