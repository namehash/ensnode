import { describe, expect, it } from "vitest";

import { profileRecordsModel } from "./test-helpers";
import { ProfileDescriptionParser, ProfileWebsiteParser } from "./texts";

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
  ])("returns null: %s", (_message, texts) => {
    expect(ProfileWebsiteParser.parse(profileRecordsModel(texts))).toBeNull();
  });
});
