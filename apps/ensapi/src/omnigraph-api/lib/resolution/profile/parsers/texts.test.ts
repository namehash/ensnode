import { describe, expect, it } from "vitest";

import { profileRecordsModel } from "./test-helpers";
import { ProfileDescriptionParser, ProfileEmailParser, ProfileWebsiteParser } from "./texts";

describe("ProfileDescriptionParser", () => {
  it("has correct selection", () => {
    expect(ProfileDescriptionParser.selection).toEqual({ texts: ["description"] });
  });

  it.each([
    ["plain text", { description: "Hello" }, "Hello"],
    ["whitespace preserved", { description: "  Hello  " }, "  Hello  "],
  ])("parses %s", (_message, texts, expected) => {
    expect(ProfileDescriptionParser.parse(profileRecordsModel(texts))).toBe(expected);
  });

  it.each([
    ["record unset", {}],
    ["empty string", { description: "" }],
  ])("returns null: %s", (_message, texts) => {
    expect(ProfileDescriptionParser.parse(profileRecordsModel(texts))).toBeNull();
  });
});

describe("ProfileWebsiteParser", () => {
  it("has correct selection", () => {
    expect(ProfileWebsiteParser.selection).toEqual({ texts: ["url"] });
  });

  it.each([
    ["https URL", { url: "https://example.com" }, "https://example.com"],
    ["http URL", { url: "http://example.com" }, "http://example.com"],
  ])("parses %s", (_message, texts, expected) => {
    expect(ProfileWebsiteParser.parse(profileRecordsModel(texts))).toBe(expected);
  });

  it.each([
    ["record unset", {}],
    ["empty string", { url: "" }],
    ["whitespace only", { url: "   " }],
    ["non-http scheme", { url: "ipfs://example.com" }],
    ["not a URL", { url: "not-a-url" }],
  ])("returns null: %s", (_message, texts) => {
    expect(ProfileWebsiteParser.parse(profileRecordsModel(texts))).toBeNull();
  });

  it("trims surrounding whitespace before parsing", () => {
    expect(
      ProfileWebsiteParser.parse(profileRecordsModel({ url: "  https://example.com  " })),
    ).toBe("https://example.com");
  });
});

describe("ProfileEmailParser", () => {
  it("has correct selection", () => {
    expect(ProfileEmailParser.selection).toEqual({ texts: ["email"] });
  });

  it.each([
    ["plain email", { email: "user@example.com" }, "user@example.com"],
    ["email with dots", { email: "first.last@example.org" }, "first.last@example.org"],
  ])("parses %s", (_message, texts, expected) => {
    expect(ProfileEmailParser.parse(profileRecordsModel(texts))).toBe(expected);
  });

  it.each([
    ["record unset", {}],
    ["empty string", { email: "" }],
    ["whitespace only", { email: "   " }],
    ["missing @", { email: "userexample.com" }],
    ["missing domain", { email: "user@" }],
    ["spaces inside", { email: "user @example.com" }],
  ])("returns null: %s", (_message, texts) => {
    expect(ProfileEmailParser.parse(profileRecordsModel(texts))).toBeNull();
  });

  it("trims surrounding whitespace from valid email", () => {
    expect(ProfileEmailParser.parse(profileRecordsModel({ email: "  user@example.com  " }))).toBe(
      "user@example.com",
    );
  });
});
