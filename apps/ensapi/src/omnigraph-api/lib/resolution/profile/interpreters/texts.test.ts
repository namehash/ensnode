import { describe, expect, it } from "vitest";

import { profileRecordsModel } from "./test-helpers";
import {
  ProfileDescriptionInterpreter,
  ProfileEmailInterpreter,
  ProfileWebsiteInterpreter,
} from "./texts";

describe("ProfileDescriptionInterpreter", () => {
  it("has correct selection", () => {
    expect(ProfileDescriptionInterpreter.selection).toEqual({ texts: ["description"] });
  });

  it.each([
    ["plain text", { description: "Hello" }, "Hello"],
    ["whitespace preserved", { description: "  Hello  " }, "  Hello  "],
  ])("parses %s", (_message, texts, expected) => {
    expect(ProfileDescriptionInterpreter.interpret(profileRecordsModel(texts))).toBe(expected);
  });

  it.each([
    ["record unset", {}],
    ["empty string", { description: "" }],
  ])("returns null: %s", (_message, texts) => {
    expect(ProfileDescriptionInterpreter.interpret(profileRecordsModel(texts))).toBeNull();
  });
});

describe("ProfileWebsiteInterpreter", () => {
  it("has correct selection", () => {
    expect(ProfileWebsiteInterpreter.selection).toEqual({ texts: ["url"] });
  });

  it.each([
    ["https URL", { url: "https://example.com" }, "https://example.com"],
    ["http URL", { url: "http://example.com" }, "http://example.com"],
  ])("parses %s", (_message, texts, expected) => {
    expect(ProfileWebsiteInterpreter.interpret(profileRecordsModel(texts))).toBe(expected);
  });

  it.each([
    ["record unset", {}],
    ["empty string", { url: "" }],
    ["whitespace only", { url: "   " }],
    ["non-http scheme", { url: "ipfs://example.com" }],
    ["not a URL", { url: "not-a-url" }],
  ])("returns null: %s", (_message, texts) => {
    expect(ProfileWebsiteInterpreter.interpret(profileRecordsModel(texts))).toBeNull();
  });

  it("trims surrounding whitespace before parsing", () => {
    expect(
      ProfileWebsiteInterpreter.interpret(profileRecordsModel({ url: "  https://example.com  " })),
    ).toBe("https://example.com");
  });
});

describe("ProfileEmailInterpreter", () => {
  it("has correct selection", () => {
    expect(ProfileEmailInterpreter.selection).toEqual({ texts: ["email"] });
  });

  it.each([
    ["plain email", { email: "user@example.com" }, "user@example.com"],
    ["email with dots", { email: "first.last@example.org" }, "first.last@example.org"],
  ])("parses %s", (_message, texts, expected) => {
    expect(ProfileEmailInterpreter.interpret(profileRecordsModel(texts))).toBe(expected);
  });

  it.each([
    ["record unset", {}],
    ["empty string", { email: "" }],
    ["whitespace only", { email: "   " }],
    ["missing @", { email: "userexample.com" }],
    ["missing domain", { email: "user@" }],
    ["spaces inside", { email: "user @example.com" }],
  ])("returns null: %s", (_message, texts) => {
    expect(ProfileEmailInterpreter.interpret(profileRecordsModel(texts))).toBeNull();
  });

  it("trims surrounding whitespace from valid email", () => {
    expect(
      ProfileEmailInterpreter.interpret(profileRecordsModel({ email: "  user@example.com  " })),
    ).toBe("user@example.com");
  });
});
