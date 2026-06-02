import { describe, expect, it } from "vitest";

import {
  SocialGithubParser,
  SocialKeybaseParser,
  SocialLinkedInParser,
  SocialTelegramParser,
  SocialTwitterParser,
} from "./social";
import { profileRecordsModel } from "./test-helpers";
import type { ProfileFieldParser } from "./types";

type SocialResult = { handle: string; httpUrl: string };

/**
 * Generates common test cases shared across social parsers:
 * bare handle, @-prefixed, leading/trailing whitespace.
 */
function commonParseCases(
  handle: string,
  expected: SocialResult,
): [label: string, input: string, expected: SocialResult][] {
  return [
    ["bare handle", handle, expected],
    ["@ prefix", `@${handle}`, expected],
    ["surrounding whitespace", `  ${handle}  `, expected],
  ];
}

/**
 * Generates common null-result test cases shared across social parsers.
 */
function commonNullCases(primaryKey: string): [label: string, texts: Record<string, string>][] {
  return [
    ["record unset", {}],
    ["empty string", { [primaryKey]: "" }],
    ["whitespace only", { [primaryKey]: "   " }],
  ];
}

/**
 * Generates URL-variant test cases for a given hostname and base URL.
 */
function urlVariantCases(
  handle: string,
  hostname: string,
  expected: SocialResult,
): [label: string, input: string, expected: SocialResult][] {
  return [
    ["https URL", `https://${hostname}/${handle}`, expected],
    ["http URL", `http://${hostname}/${handle}`, expected],
    ["hostname without scheme", `${hostname}/${handle}`, expected],
    ["trailing slash", `https://${hostname}/${handle}/`, expected],
  ];
}

function describeSocialParser(
  name: string,
  parser: ProfileFieldParser<SocialResult>,
  primaryKey: string,
  {
    selection,
    parseCases,
    nullCases = [],
  }: {
    selection: { texts: string[] };
    parseCases: [label: string, input: string, expected: SocialResult][];
    nullCases?: [label: string, texts: Record<string, string>][];
  },
) {
  describe(name, () => {
    it("has correct selection", () => {
      expect(parser.selection).toEqual(selection);
    });

    it.each(parseCases)("parses %s", (_label, input, expected) => {
      expect(parser.parse(profileRecordsModel({ [primaryKey]: input }))).toEqual(expected);
    });

    it.each([...commonNullCases(primaryKey), ...nullCases])("returns null: %s", (_label, texts) => {
      expect(parser.parse(profileRecordsModel(texts))).toBeNull();
    });
  });
}

// --- GitHub ---

const EXPECTED_GITHUB: SocialResult = {
  handle: "itslevchiks",
  httpUrl: "https://github.com/itslevchiks",
};

describeSocialParser("SocialGithubParser", SocialGithubParser, "com.github", {
  selection: { texts: ["com.github", "vnd.github"] },
  parseCases: [
    ...commonParseCases("itslevchiks", EXPECTED_GITHUB),
    ...urlVariantCases("itslevchiks", "github.com", EXPECTED_GITHUB),
    ["www hostname", "www.github.com/itslevchiks", EXPECTED_GITHUB],
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
  ],
  nullCases: [
    ["invalid handle characters", { "com.github": "invalid user name!" }],
    ["foreign social URL", { "com.github": "https://twitter.com/itslevchiks" }],
  ],
});

// --- Twitter ---

const EXPECTED_TWITTER: SocialResult = {
  handle: "itslevchiks",
  httpUrl: "https://x.com/itslevchiks",
};

describeSocialParser("SocialTwitterParser", SocialTwitterParser, "com.x", {
  selection: { texts: ["com.x", "com.twitter", "vnd.twitter"] },
  parseCases: [
    ...commonParseCases("itslevchiks", EXPECTED_TWITTER),
    ["https x.com URL", "https://x.com/itslevchiks", EXPECTED_TWITTER],
    ["http x.com URL", "http://x.com/itslevchiks", EXPECTED_TWITTER],
    ["x.com without scheme", "x.com/itslevchiks", EXPECTED_TWITTER],
    ["twitter.com hostname", "www.twitter.com/itslevchiks", EXPECTED_TWITTER],
    ["trailing slash", "twitter.com/itslevchiks/", EXPECTED_TWITTER],
    [
      "query string",
      "twitter.com/itslevchiks?lang=en",
      { handle: "itslevchiks", httpUrl: "https://x.com/itslevchiks?lang=en" },
    ],
  ],
  nullCases: [
    ["invalid handle characters", { "com.x": "hello world" }],
    ["foreign social URL", { "com.x": "https://github.com/itslevchiks" }],
  ],
});

// --- Telegram ---

const EXPECTED_TELEGRAM: SocialResult = {
  handle: "itslevchiks",
  httpUrl: "https://t.me/itslevchiks",
};

describeSocialParser("SocialTelegramParser", SocialTelegramParser, "org.telegram", {
  selection: { texts: ["org.telegram"] },
  parseCases: [
    ...commonParseCases("itslevchiks", EXPECTED_TELEGRAM),
    ["https t.me URL", "https://t.me/itslevchiks", EXPECTED_TELEGRAM],
    ["http t.me URL", "http://t.me/itslevchiks", EXPECTED_TELEGRAM],
    ["t.me without scheme", "t.me/itslevchiks", EXPECTED_TELEGRAM],
    ["telegram.me hostname", "telegram.me/itslevchiks", EXPECTED_TELEGRAM],
    ["trailing slash", "t.me/itslevchiks/", EXPECTED_TELEGRAM],
  ],
  nullCases: [
    ["invalid handle characters", { "org.telegram": "bad handle!" }],
    ["foreign social URL", { "org.telegram": "https://twitter.com/itslevchiks" }],
  ],
});

// --- LinkedIn ---

const EXPECTED_LINKEDIN: SocialResult = {
  handle: "itslevchiks",
  httpUrl: "https://www.linkedin.com/in/itslevchiks",
};

describeSocialParser("SocialLinkedInParser", SocialLinkedInParser, "com.linkedin", {
  selection: { texts: ["com.linkedin"] },
  parseCases: [
    ...commonParseCases("itslevchiks", EXPECTED_LINKEDIN),
    ["https URL", "https://linkedin.com/in/itslevchiks", EXPECTED_LINKEDIN],
    ["www hostname", "https://www.linkedin.com/in/itslevchiks", EXPECTED_LINKEDIN],
    [
      "handle with hyphen",
      "my-handle",
      { handle: "my-handle", httpUrl: "https://www.linkedin.com/in/my-handle" },
    ],
    ["trailing slash", "https://linkedin.com/in/itslevchiks/", EXPECTED_LINKEDIN],
  ],
  nullCases: [
    ["invalid handle characters", { "com.linkedin": "bad handle!" }],
    ["foreign social URL", { "com.linkedin": "https://twitter.com/itslevchiks" }],
  ],
});

// --- Keybase ---

const EXPECTED_KEYBASE: SocialResult = {
  handle: "itslevchiks",
  httpUrl: "https://keybase.io/itslevchiks",
};

describeSocialParser("SocialKeybaseParser", SocialKeybaseParser, "io.keybase", {
  selection: { texts: ["io.keybase"] },
  parseCases: [
    ...commonParseCases("itslevchiks", EXPECTED_KEYBASE),
    ...urlVariantCases("itslevchiks", "keybase.io", EXPECTED_KEYBASE),
  ],
  nullCases: [
    ["invalid handle characters", { "io.keybase": "bad handle!" }],
    ["foreign social URL", { "io.keybase": "https://github.com/itslevchiks" }],
  ],
});

// --- Fallback key tests ---

describe("SocialGithubParser (vnd.github fallback)", () => {
  it("falls back to vnd.github when com.github is unset", () => {
    expect(SocialGithubParser.parse(profileRecordsModel({ "vnd.github": "itslevchiks" }))).toEqual(
      EXPECTED_GITHUB,
    );
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
  it("falls back to com.twitter when com.x is unset", () => {
    expect(
      SocialTwitterParser.parse(profileRecordsModel({ "com.twitter": "itslevchiks" })),
    ).toEqual(EXPECTED_TWITTER);
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
    ).toEqual(EXPECTED_TWITTER);
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
