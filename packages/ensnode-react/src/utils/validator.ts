/**
 * Basic validator for ENSNode endpoint URLs
 * This is a simple implementation that validates URL format
 * In the future, this could be extended to validate ENSNode compatibility
 */
export class BasicEnsNodeValidator {
  /**
   * Validates an ENSNode endpoint URL
   *
   * @param url - The URL to validate
   * @returns Promise with validation result
   */
  async validate(url: string): Promise<{ isValid: boolean; error?: string }> {
    if (!url) {
      return {
        isValid: false,
        error: "URL is required",
      };
    }

    // Check if URL starts with http:// or https://
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return {
        isValid: false,
        error: "URL must start with http:// or https://",
      };
    }

    // Try to parse as URL
    try {
      new URL(url);
    } catch {
      return {
        isValid: false,
        error: "Invalid URL format",
      };
    }

    // TODO: In the future, we could add more sophisticated validation:
    // - Check if the endpoint responds
    // - Validate ENSNode API compatibility
    // - Check for required endpoints (/health, /resolve, etc.)

    return {
      isValid: true,
    };
  }
}

/**
 * Default validator instance
 */
export const defaultValidator = new BasicEnsNodeValidator();
