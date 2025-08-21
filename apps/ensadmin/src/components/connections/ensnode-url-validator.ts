type ValidationResult = { isValid: true; error?: never } | { isValid: false; error: string };

// TODO: more advanced validation (i.e. confirm ENSNode status response, version numbers...)
export async function validateENSNodeUrl(url: string): Promise<ValidationResult> {
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
