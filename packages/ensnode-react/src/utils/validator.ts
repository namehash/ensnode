import type { ENSIndexerPublicConfig, ENSNodeValidator } from "../types";

/**
 * Basic validator for ENSNode endpoint URLs
 * Validates URL format and fetches ENSIndexer Public Config
 */
export class BasicEnsNodeValidator implements ENSNodeValidator {
  /**
   * Validates an ENSNode endpoint URL and fetches its public configuration
   *
   * @param url - The URL to validate
   * @returns Promise with validation result and optional config
   */
  async validate(url: string): Promise<{
    isValid: boolean;
    error?: string;
    config?: ENSIndexerPublicConfig;
  }> {
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
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return {
        isValid: false,
        error: "Invalid URL format",
      };
    }

    // Try to fetch ENSIndexer Public Config
    try {
      const configUrl = new URL("/config", parsedUrl);
      const response = await fetch(configUrl.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(10000), // 10 seconds
      });

      if (!response.ok) {
        // If config endpoint doesn't exist, try a health check
        const healthUrl = new URL("/health", parsedUrl);
        const healthResponse = await fetch(healthUrl.toString(), {
          method: "GET",
          signal: AbortSignal.timeout(5000), // 5 seconds
        });

        if (!healthResponse.ok) {
          return {
            isValid: false,
            error: `ENSNode endpoint is not responding (HTTP ${response.status})`,
          };
        }

        // Health check passed but no config endpoint
        return {
          isValid: true,
          config: {
            apiVersion: "unknown",
            features: [],
          },
        };
      }

      const config: ENSIndexerPublicConfig = await response.json();

      return {
        isValid: true,
        config,
      };
    } catch (error) {
      // If we can't fetch config, try a basic connectivity check
      try {
        const response = await fetch(parsedUrl.toString(), {
          method: "HEAD",
          signal: AbortSignal.timeout(5000), // 5 seconds
        });

        // Basic connectivity works
        return {
          isValid: true,
          config: {
            apiVersion: "unknown",
            features: [],
          },
        };
      } catch {
        return {
          isValid: false,
          error:
            error instanceof Error
              ? `Cannot connect to ENSNode endpoint: ${error.message}`
              : "Cannot connect to ENSNode endpoint",
        };
      }
    }
  }
}

/**
 * Default validator instance
 */
export const defaultValidator = new BasicEnsNodeValidator();
