import { type UrlString } from "@ensnode/ensnode-sdk";

export const normalizeUrl = (url: UrlString): UrlString => {
  try {
    return new URL(url).toString();
  } catch {
    // If URL parsing fails, try prefixing with https://
    return new URL(`https://${url}`).toString();
  }
};

export const isValidUrl = (url: UrlString): boolean => {
  try {
    normalizeUrl(url);
    return true;
  } catch {
    return false;
  }
};

type ValidationResult =
  | { isValid: true; normalizedUrl: UrlString }
  | { isValid: false; error: string };

/**
 * Validates and normalizes a raw URL input to ensure it's a valid ENSNode connection URL.
 * This is the standard pipeline for processing URL input from any source (user input, env vars, etc).
 *
 * Pipeline: raw input -> normalizeUrl() -> isValidENSNodeConnectionUrl()
 *
 * @param rawUrl - Raw URL input from any source
 * @returns ValidationResult with either normalized URL or error message
 */
export const validateAndNormalizeENSNodeUrl = (rawUrl: string): ValidationResult => {
  try {
    // Step 1: Normalize the URL
    const normalizedUrl = normalizeUrl(rawUrl);

    // Step 2: Validate it as an ENSNode connection URL
    if (!isValidENSNodeConnectionUrl(normalizedUrl)) {
      return {
        isValid: false,
        error: "Invalid ENSNode connection URL format",
      };
    }

    return {
      isValid: true,
      normalizedUrl,
    };
  } catch {
    return {
      isValid: false,
      error: "Please enter a valid URL",
    };
  }
};

/**
 * Validates if a normalized URL string is a valid ENSNode connection URL.
 * This function should only be called on URLs that have already passed through normalizeUrl().
 *
 * @param normalizedUrl - A URL string that has been normalized via normalizeUrl()
 * @returns true if the URL is a valid ENSNode connection URL, false otherwise
 */
export const isValidENSNodeConnectionUrl = (normalizedUrl: UrlString): boolean => {
  try {
    const parsedUrl = new URL(normalizedUrl);

    // Must use HTTP or HTTPS protocol
    if (!parsedUrl.protocol.startsWith("http")) {
      return false;
    }

    // Validate hostname - must contain at least one dot or be localhost
    if (!parsedUrl.hostname.includes(".") && parsedUrl.hostname !== "localhost") {
      return false;
    }

    // Check for reasonable hostname format (basic validation)
    // Validates a domain/hostname (labels separated by dots, alphanumeric with optional internal hyphens, no leading/trailing hyphens or dots)
    const hostnamePattern =
      /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/;
    if (!hostnamePattern.test(parsedUrl.hostname) && parsedUrl.hostname !== "localhost") {
      return false;
    }

    return true;
  } catch {
    return false;
  }
};
