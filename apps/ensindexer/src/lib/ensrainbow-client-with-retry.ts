import pRetry from "p-retry";

import { type EnsRainbow, ErrorCode, isHealError } from "@ensnode/ensrainbow-sdk";

export interface EnsRainbowRetryOptions {
  retries?: number;
  minTimeout?: number;
  maxTimeout?: number;
}

const DEFAULT_RETRY_OPTIONS: Required<EnsRainbowRetryOptions> = {
  retries: 3,
  minTimeout: 1000,
  maxTimeout: 30_000,
};

/**
 * Wraps an {@link EnsRainbow.ApiClient} to add retry-with-backoff for `heal()`.
 *
 * Only `heal()` is retried — on network/fetch throws and on returned
 * {@link EnsRainbow.HealServerError} responses (transient, non-cacheable).
 * All other methods delegate directly to the inner client.
 */
export class EnsRainbowClientWithRetry implements EnsRainbow.ApiClient {
  private inner: EnsRainbow.ApiClient;
  private retryOptions: Required<EnsRainbowRetryOptions>;

  constructor(inner: EnsRainbow.ApiClient, options?: EnsRainbowRetryOptions) {
    this.inner = inner;
    this.retryOptions = { ...DEFAULT_RETRY_OPTIONS, ...options };
  }

  count: EnsRainbow.ApiClient["count"] = () => this.inner.count();

  config: EnsRainbow.ApiClient["config"] = () => this.inner.config();

  health: EnsRainbow.ApiClient["health"] = () => this.inner.health();

  version: EnsRainbow.ApiClient["version"] = () => this.inner.version();

  getOptions: EnsRainbow.ApiClient["getOptions"] = () => this.inner.getOptions();

  heal: EnsRainbow.ApiClient["heal"] = async (labelHash) => {
    let lastServerError: EnsRainbow.HealServerError | undefined;

    try {
      return await pRetry(
        async () => {
          const response = await this.inner.heal(labelHash);

          if (isHealError(response) && response.errorCode === ErrorCode.ServerError) {
            lastServerError = response;
            throw new Error(response.error);
          }

          return response;
        },
        {
          retries: this.retryOptions.retries,
          minTimeout: this.retryOptions.minTimeout,
          maxTimeout: this.retryOptions.maxTimeout,
          onFailedAttempt({ error, attemptNumber, retriesLeft }) {
            console.warn(
              `ENSRainbow heal failed (attempt ${attemptNumber}): ${error.message}. ${retriesLeft} retries left.`,
            );
          },
        },
      );
    } catch (error) {
      if (lastServerError) {
        return lastServerError;
      }

      throw error;
    }
  };
}
