import { describe, expect, it } from "vitest";

import {
  SocialGithubParser,
  SocialKeybaseParser,
  SocialLinkedInParser,
  SocialTelegramParser,
  SocialTwitterParser,
} from "./social";
import { profileRecordsModel } from "./test-helpers";

describe("SocialGithubParser", () => {
  it("has correct selection", () => {
    expect(SocialGithubParser.selection).toEqual({ texts: ["com.github", "vnd.github"] });
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
    expect(SocialTwitterParser.selection).toEqual({
      texts: ["com.x", "com.twitter", "vnd.twitter"],
    });
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
    expect(SocialTwitterParser.parse(profileRecordsModel({ "com.x": input }))).toEqual(expected);
  });

  it.each([
    ["record unset", {}],
    ["empty string", { "com.x": "" }],
    ["invalid handle characters", { "com.x": "hello world" }],
    ["foreign social URL", { "com.x": "https://github.com/itslevchiks" }],
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

describe("SocialGithubParser (vnd.github fallback)", () => {
  it("has correct selection (includes vnd.github)", () => {
    expect(SocialGithubParser.selection).toEqual({ texts: ["com.github", "vnd.github"] });
  });

  it("falls back to vnd.github when com.github is unset", () => {
    expect(SocialGithubParser.parse(profileRecordsModel({ "vnd.github": "itslevchiks" }))).toEqual({
      handle: "itslevchiks",
      httpUrl: "https://github.com/itslevchiks",
    });
  });

  it("prefers com.github over vnd.github", () => {
    expect(
      SocialGithubParser.parse(
        profileRecordsModel({ "com.github": "primary-user", "vnd.github": "legacy-user" }),
      ),
    ).toEqual({ handle: "primary-user", httpUrl: "https://github.com/primary-user" });
  });

  it("falls back to vnd.github when com.github is empty", () => {
    expect(
      SocialGithubParser.parse(
        profileRecordsModel({ "com.github": "", "vnd.github": "legacy-user" }),
      ),
    ).toEqual({ handle: "legacy-user", httpUrl: "https://github.com/legacy-user" });
  });
});

describe("SocialTwitterParser (text key fallbacks)", () => {
  it("has correct selection (includes com.twitter and vnd.twitter)", () => {
    expect(SocialTwitterParser.selection).toEqual({
      texts: ["com.x", "com.twitter", "vnd.twitter"],
    });
  });

  it("falls back to com.twitter when com.x is unset", () => {
    expect(
      SocialTwitterParser.parse(profileRecordsModel({ "com.twitter": "itslevchiks" })),
    ).toEqual({ handle: "itslevchiks", httpUrl: "https://x.com/itslevchiks" });
  });

  it("prefers com.x over com.twitter", () => {
    expect(
      SocialTwitterParser.parse(
        profileRecordsModel({ "com.x": "primaryuser", "com.twitter": "legacyuser" }),
      ),
    ).toEqual({ handle: "primaryuser", httpUrl: "https://x.com/primaryuser" });
  });

  it("falls back to com.twitter when com.x is empty", () => {
    expect(
      SocialTwitterParser.parse(profileRecordsModel({ "com.x": "", "com.twitter": "legacyuser" })),
    ).toEqual({ handle: "legacyuser", httpUrl: "https://x.com/legacyuser" });
  });

  it("falls back to vnd.twitter when com.x and com.twitter are unset", () => {
    expect(
      SocialTwitterParser.parse(profileRecordsModel({ "vnd.twitter": "itslevchiks" })),
    ).toEqual({ handle: "itslevchiks", httpUrl: "https://x.com/itslevchiks" });
  });

  it("prefers com.twitter over vnd.twitter", () => {
    expect(
      SocialTwitterParser.parse(
        profileRecordsModel({ "com.twitter": "primaryuser", "vnd.twitter": "legacyuser" }),
      ),
    ).toEqual({ handle: "primaryuser", httpUrl: "https://x.com/primaryuser" });
  });

  it("falls back to vnd.twitter when com.x and com.twitter are empty", () => {
    expect(
      SocialTwitterParser.parse(
        profileRecordsModel({ "com.x": "", "com.twitter": "", "vnd.twitter": "legacyuser" }),
      ),
    ).toEqual({ handle: "legacyuser", httpUrl: "https://x.com/legacyuser" });
  });
});

describe("SocialLinkedInParser", () => {
  it("has correct selection", () => {
    expect(SocialLinkedInParser.selection).toEqual({ texts: ["com.linkedin"] });
  });

  it.each([
    [
      "bare handle",
      "itslevchiks",
      { handle: "itslevchiks", httpUrl: "https://www.linkedin.com/in/itslevchiks" },
    ],
    [
      "@ prefix",
      "@itslevchiks",
      { handle: "itslevchiks", httpUrl: "https://www.linkedin.com/in/itslevchiks" },
    ],
    [
      "https URL",
      "https://linkedin.com/in/itslevchiks",
      { handle: "itslevchiks", httpUrl: "https://www.linkedin.com/in/itslevchiks" },
    ],
    [
      "www hostname",
      "https://www.linkedin.com/in/itslevchiks",
      { handle: "itslevchiks", httpUrl: "https://www.linkedin.com/in/itslevchiks" },
    ],
    [
      "handle with hyphen",
      "my-handle",
      { handle: "my-handle", httpUrl: "https://www.linkedin.com/in/my-handle" },
    ],
    [
      "trailing slash",
      "https://linkedin.com/in/itslevchiks/",
      { handle: "itslevchiks", httpUrl: "https://www.linkedin.com/in/itslevchiks" },
    ],
  ])("parses %s", (_message, input, expected) => {
    expect(SocialLinkedInParser.parse(profileRecordsModel({ "com.linkedin": input }))).toEqual(
      expected,
    );
  });

  it.each([
    ["record unset", {}],
    ["empty string", { "com.linkedin": "" }],
    ["invalid handle characters", { "com.linkedin": "bad handle!" }],
    ["foreign social URL", { "com.linkedin": "https://twitter.com/itslevchiks" }],
  ])("returns null: %s", (_message, texts) => {
    expect(SocialLinkedInParser.parse(profileRecordsModel(texts))).toBeNull();
  });
});

describe("SocialKeybaseParser", () => {
  it("has correct selection", () => {
    expect(SocialKeybaseParser.selection).toEqual({ texts: ["io.keybase"] });
  });

  it.each([
    [
      "bare handle",
      "itslevchiks",
      { handle: "itslevchiks", httpUrl: "https://keybase.io/itslevchiks" },
    ],
    [
      "@ prefix",
      "@itslevchiks",
      { handle: "itslevchiks", httpUrl: "https://keybase.io/itslevchiks" },
    ],
    [
      "https URL",
      "https://keybase.io/itslevchiks",
      { handle: "itslevchiks", httpUrl: "https://keybase.io/itslevchiks" },
    ],
    [
      "http URL",
      "http://keybase.io/itslevchiks",
      { handle: "itslevchiks", httpUrl: "https://keybase.io/itslevchiks" },
    ],
    [
      "without scheme",
      "keybase.io/itslevchiks",
      { handle: "itslevchiks", httpUrl: "https://keybase.io/itslevchiks" },
    ],
    [
      "trailing slash",
      "keybase.io/itslevchiks/",
      { handle: "itslevchiks", httpUrl: "https://keybase.io/itslevchiks" },
    ],
  ])("parses %s", (_message, input, expected) => {
    expect(SocialKeybaseParser.parse(profileRecordsModel({ "io.keybase": input }))).toEqual(
      expected,
    );
  });

  it.each([
    ["record unset", {}],
    ["empty string", { "io.keybase": "" }],
    ["invalid handle characters", { "io.keybase": "bad handle!" }],
    ["foreign social URL", { "io.keybase": "https://github.com/itslevchiks" }],
  ])("returns null: %s", (_message, texts) => {
    expect(SocialKeybaseParser.parse(profileRecordsModel(texts))).toBeNull();
  });
});
