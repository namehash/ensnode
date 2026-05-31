import { describe, expect, it } from "vitest";

import { SocialGithubParser, SocialTelegramParser, SocialTwitterParser } from "./social";
import { profileRecordsModel } from "./test-helpers";

describe("SocialGithubParser", () => {
  it("has correct selection", () => {
    expect(SocialGithubParser.selection).toEqual({ texts: ["com.github"] });
  });

  it.each([
    [
      "bare handle",
      "itslevchiks",
      { handle: "itslevchiks", httpUrl: "https://github.com/itslevchiks" },
    ],
    [
      "@ prefix",
      "@itslevchiks",
      { handle: "itslevchiks", httpUrl: "https://github.com/itslevchiks" },
    ],
    [
      "https URL",
      "https://github.com/itslevchiks",
      { handle: "itslevchiks", httpUrl: "https://github.com/itslevchiks" },
    ],
    [
      "http URL",
      "http://github.com/itslevchiks",
      { handle: "itslevchiks", httpUrl: "https://github.com/itslevchiks" },
    ],
    [
      "hostname without scheme",
      "github.com/itslevchiks",
      { handle: "itslevchiks", httpUrl: "https://github.com/itslevchiks" },
    ],
    [
      "www hostname",
      "www.github.com/itslevchiks",
      { handle: "itslevchiks", httpUrl: "https://github.com/itslevchiks" },
    ],
    [
      "trailing slash",
      "https://github.com/itslevchiks/",
      { handle: "itslevchiks", httpUrl: "https://github.com/itslevchiks" },
    ],
    [
      "query string",
      "https://github.com/itslevchiks?tab=repos",
      { handle: "itslevchiks", httpUrl: "https://github.com/itslevchiks?tab=repos" },
    ],
    [
      "hash fragment",
      "https://github.com/itslevchiks#readme",
      { handle: "itslevchiks", httpUrl: "https://github.com/itslevchiks#readme" },
    ],
    [
      "surrounding whitespace",
      "  itslevchiks  ",
      { handle: "itslevchiks", httpUrl: "https://github.com/itslevchiks" },
    ],
    [
      "hyphen and underscore",
      "My-Handle_99",
      { handle: "My-Handle_99", httpUrl: "https://github.com/My-Handle_99" },
    ],
    [
      "repo URL",
      "https://github.com/itslevchiks/some-repo",
      { handle: "itslevchiks/some-repo", httpUrl: "https://github.com/itslevchiks/some-repo" },
    ],
    [
      "repo URL with query string",
      "https://github.com/itslevchiks/some-repo#intro?tab=readme",
      {
        handle: "itslevchiks/some-repo",
        httpUrl: "https://github.com/itslevchiks/some-repo#intro?tab=readme",
      },
    ],
    [
      "bare org/repo path",
      "itslevchiks/some-repo",
      { handle: "itslevchiks/some-repo", httpUrl: "https://github.com/itslevchiks/some-repo" },
    ],
  ])("parses %s", (_message, input, expected) => {
    expect(SocialGithubParser.parse(profileRecordsModel({ "com.github": input }))).toEqual(
      expected,
    );
  });

  it.each([
    ["record unset", {}],
    ["empty string", { "com.github": "" }],
    ["whitespace only", { "com.github": "   " }],
    ["invalid handle characters", { "com.github": "invalid user name!" }],
    ["foreign social URL", { "com.github": "https://twitter.com/itslevchiks" }],
  ])("returns null: %s", (_message, texts) => {
    expect(SocialGithubParser.parse(profileRecordsModel(texts))).toBeNull();
  });
});

describe("SocialTwitterParser", () => {
  it("has correct selection", () => {
    expect(SocialTwitterParser.selection).toEqual({ texts: ["com.twitter"] });
  });

  it.each([
    ["bare handle", "itslevchiks", { handle: "itslevchiks", httpUrl: "https://x.com/itslevchiks" }],
    ["@ prefix", "@itslevchiks", { handle: "itslevchiks", httpUrl: "https://x.com/itslevchiks" }],
    [
      "https x.com URL",
      "https://x.com/itslevchiks",
      { handle: "itslevchiks", httpUrl: "https://x.com/itslevchiks" },
    ],
    [
      "http x.com URL",
      "http://x.com/itslevchiks",
      { handle: "itslevchiks", httpUrl: "https://x.com/itslevchiks" },
    ],
    [
      "x.com without scheme",
      "x.com/itslevchiks",
      { handle: "itslevchiks", httpUrl: "https://x.com/itslevchiks" },
    ],
    [
      "twitter.com hostname",
      "www.twitter.com/itslevchiks",
      { handle: "itslevchiks", httpUrl: "https://x.com/itslevchiks" },
    ],
    [
      "trailing slash",
      "twitter.com/itslevchiks/",
      { handle: "itslevchiks", httpUrl: "https://x.com/itslevchiks" },
    ],
    [
      "query string",
      "twitter.com/itslevchiks?lang=en",
      { handle: "itslevchiks", httpUrl: "https://x.com/itslevchiks?lang=en" },
    ],
  ])("parses %s", (_message, input, expected) => {
    expect(SocialTwitterParser.parse(profileRecordsModel({ "com.twitter": input }))).toEqual(
      expected,
    );
  });

  it.each([
    ["record unset", {}],
    ["empty string", { "com.twitter": "" }],
    ["invalid handle characters", { "com.twitter": "hello world" }],
    ["foreign social URL", { "com.twitter": "https://github.com/itslevchiks" }],
  ])("returns null: %s", (_message, texts) => {
    expect(SocialTwitterParser.parse(profileRecordsModel(texts))).toBeNull();
  });
});

describe("SocialTelegramParser", () => {
  it("has correct selection", () => {
    expect(SocialTelegramParser.selection).toEqual({ texts: ["org.telegram"] });
  });

  it.each([
    ["bare handle", "itslevchiks", { handle: "itslevchiks", httpUrl: "https://t.me/itslevchiks" }],
    ["@ prefix", "@itslevchiks", { handle: "itslevchiks", httpUrl: "https://t.me/itslevchiks" }],
    [
      "https t.me URL",
      "https://t.me/itslevchiks",
      { handle: "itslevchiks", httpUrl: "https://t.me/itslevchiks" },
    ],
    [
      "http t.me URL",
      "http://t.me/itslevchiks",
      { handle: "itslevchiks", httpUrl: "https://t.me/itslevchiks" },
    ],
    [
      "t.me without scheme",
      "t.me/itslevchiks",
      { handle: "itslevchiks", httpUrl: "https://t.me/itslevchiks" },
    ],
    [
      "telegram.me hostname",
      "telegram.me/itslevchiks",
      { handle: "itslevchiks", httpUrl: "https://t.me/itslevchiks" },
    ],
    [
      "trailing slash",
      "t.me/itslevchiks/",
      { handle: "itslevchiks", httpUrl: "https://t.me/itslevchiks" },
    ],
  ])("parses %s", (_message, input, expected) => {
    expect(SocialTelegramParser.parse(profileRecordsModel({ "org.telegram": input }))).toEqual(
      expected,
    );
  });

  it.each([
    ["record unset", {}],
    ["empty string", { "org.telegram": "" }],
    ["invalid handle characters", { "org.telegram": "bad handle!" }],
    ["foreign social URL", { "org.telegram": "https://twitter.com/itslevchiks" }],
  ])("returns null: %s", (_message, texts) => {
    expect(SocialTelegramParser.parse(profileRecordsModel(texts))).toBeNull();
  });
});
