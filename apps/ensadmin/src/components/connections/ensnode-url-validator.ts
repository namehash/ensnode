export interface EnsNodeValidator {
  validate(url: string): Promise<{ isValid: boolean; error?: string }>;
}

type ValidationResult = { isValid: true; error?: never } | { isValid: false; error: string };

export class BasicEnsNodeValidator implements EnsNodeValidator {
  async validate(url: string): Promise<ValidationResult> {
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
