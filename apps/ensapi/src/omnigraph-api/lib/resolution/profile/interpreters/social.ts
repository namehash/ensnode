import type { ProfileFieldInterpreter } from "./types";

export type SocialHandleResult = {
  handle: string;
  httpUrl: string;
};

export type ParseSocialHandleOptions = {
  /** Raw text record value to parse. */
  value: string | null | undefined;
  /** Accepted URL hostnames (e.g. ["github.com", "www.github.com"]). */
  hostnames: readonly string[];
  /** Base URL used to build the canonical profile URL (e.g. "https://github.com"). */
  baseUrl: string;
  /** Regex pattern the extracted handle must match. */
  handlePattern: RegExp;
};

function pathOffsetFromBaseUrl(baseUrl: string): number {
  return new URL(baseUrl).pathname.split("/").filter((s) => s.length > 0).length;
}

/**
 * Normalizes a social handle from a raw ENS text record value.
 *
 * Tolerates several input shapes:
 * - Bare handle: `itslevchiks`
 * - With leading @: `@itslevchiks`
 * - Full URL: `https://github.com/itslevchiks`, `http://github.com/itslevchiks`
 * - Repo URL: `https://github.com/itslevchiks/my-repo`
 * - URL without scheme: `github.com/itslevchiks`
 *
 * Returns null when the value is missing, empty, unparseable, or the extracted
 * handle does not pass the character-class validation.
 */
export function parseSocialHandle({
  value,
  hostnames,
  baseUrl,
  handlePattern,
}: ParseSocialHandleOptions): SocialHandleResult | null {
  const pathOffset = pathOffsetFromBaseUrl(baseUrl);
  const raw = value?.trim();
  if (!raw) return null;

  let handle: string | null = null;
  let httpUrl: string | null = null;

  // Attempt to parse as URL — prepend https:// if it looks like a bare hostname/path
  const toParse = raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
  try {
    const url = new URL(toParse);
    if (hostnames.includes(url.hostname)) {
      const segments = url.pathname.split("/").filter((s) => s.length > 0);
      handle = segments.slice(pathOffset).join("/");
      handle = handle === "" ? null : handle;

      if (handle) {
        const baseUrlParsed = new URL(baseUrl);
        url.host = baseUrlParsed.host;
        url.protocol = baseUrlParsed.protocol;
        url.pathname = url.pathname.endsWith("/") ? url.pathname.slice(0, -1) : url.pathname;
        httpUrl = url.toString();
      }
    }
  } catch {
    // Not a valid URL — fall through to bare handle treatment
  }

  // If URL parsing did not produce a handle, treat as a bare handle
  if (handle === null) {
    handle = raw.startsWith("@") ? raw.slice(1) : raw;
  }

  if (!handle || !handlePattern.test(handle)) return null;

  return { handle, httpUrl: httpUrl ?? `${baseUrl}/${handle}` };
}

const socialInterpreter = (
  textKeys: string | readonly string[],
  hostnames: readonly string[],
  baseUrl: string,
  handlePattern: RegExp,
): ProfileFieldInterpreter<SocialHandleResult> => {
  const keys = typeof textKeys === "string" ? [textKeys] : [...textKeys];
  const opts = { hostnames, baseUrl, handlePattern };
  return {
    selection: { texts: keys },
    interpret: (result) => {
      for (const key of keys) {
        const parsed = parseSocialHandle({ value: result.records.texts?.[key], ...opts });
        if (parsed !== null) return parsed;
      }
      return null;
    },
  };
};

export const SocialGithubInterpreter: ProfileFieldInterpreter<SocialHandleResult> =
  socialInterpreter(
    ["com.github", "vnd.github"],
    ["github.com", "www.github.com"],
    "https://github.com",
    /^[A-Za-z0-9_./-]+$/,
  );

export const SocialTwitterInterpreter: ProfileFieldInterpreter<SocialHandleResult> =
  socialInterpreter(
    ["com.x", "com.twitter", "vnd.twitter"],
    ["twitter.com", "www.twitter.com", "x.com", "www.x.com"],
    "https://x.com",
    /^[A-Za-z0-9_]+$/,
  );

export const SocialTelegramInterpreter: ProfileFieldInterpreter<SocialHandleResult> =
  socialInterpreter(
    "org.telegram",
    ["t.me", "telegram.me", "www.telegram.me", "www.t.me"],
    "https://t.me",
    /^[A-Za-z0-9_]+$/,
  );

export const SocialLinkedInInterpreter: ProfileFieldInterpreter<SocialHandleResult> =
  socialInterpreter(
    "com.linkedin",
    ["linkedin.com", "www.linkedin.com"],
    "https://www.linkedin.com/in",
    /^[A-Za-z0-9_-]+$/,
  );

export const SocialKeybaseInterpreter: ProfileFieldInterpreter<SocialHandleResult> =
  socialInterpreter(
    "io.keybase",
    ["keybase.io", "www.keybase.io"],
    "https://keybase.io",
    /^[A-Za-z0-9_]+$/,
  );

/** All social interpreters keyed by their GraphQL field name. */
export const SOCIAL_INTERPRETERS = {
  github: SocialGithubInterpreter,
  twitter: SocialTwitterInterpreter,
  telegram: SocialTelegramInterpreter,
  linkedin: SocialLinkedInInterpreter,
  keybase: SocialKeybaseInterpreter,
} as const satisfies Record<string, ProfileFieldInterpreter<SocialHandleResult>>;
