import { normalizeUrl } from "@/lib/url-utils";

type ValidationResult = { isValid: true; error?: never } | { isValid: false; error: string };

// TODO: more advanced validation (i.e. confirm ENSNode status response, version numbers...)
export async function validateENSNodeUrl(url: string): Promise<ValidationResult> {
  try {
    const normalizedUrl = normalizeUrl(url);
    const parsedUrl = new URL(normalizedUrl);

    // Basic URL validation
    if (!parsedUrl.protocol.startsWith("http")) {
      return {
        isValid: false,
        error: "URL must use HTTP or HTTPS protocol",
      };
    }

    // Validate hostname - must contain at least one dot or be localhost
    if (!parsedUrl.hostname.includes(".") && parsedUrl.hostname !== "localhost") {
      return {
        isValid: false,
        error: "Please enter a valid domain name",
      };
    }

    // Check for reasonable hostname format (basic validation)
    const hostnamePattern =
      /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/;
    if (!hostnamePattern.test(parsedUrl.hostname) && parsedUrl.hostname !== "localhost") {
      return {
        isValid: false,
        error: "Please enter a valid domain name",
      };
    }

    return { isValid: true };
  } catch {
    return {
      isValid: false,
      error: "Please enter a valid URL",
    };
  }
}
