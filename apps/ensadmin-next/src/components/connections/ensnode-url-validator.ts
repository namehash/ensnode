export interface EnsNodeValidator {
  validate(url: string): Promise<{ isValid: boolean; error?: string }>;
}

export class BasicEnsNodeValidator implements EnsNodeValidator {
  async validate(url: string): Promise<{ isValid: boolean; error?: string }> {
    try {
      const parsedUrl = new URL(url);

      // Basic URL validation
      if (!parsedUrl.protocol.startsWith("http")) {
        return {
          isValid: false,
          error: "URL must use HTTP or HTTPS protocol",
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
}
