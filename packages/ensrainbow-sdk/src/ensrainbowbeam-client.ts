import {
  type LabelHash,
  type LiteralLabel,
  type NormalizedAddress,
  toNormalizedAddress,
} from "enssdk";

/**
 * Default EnsRainbowBeam base URL for local development (see Compose / app README).
 */
export const DEFAULT_ENSRAINBOWBEAM_URL = "http://localhost:4444" as const;

/**
 * Must stay in sync with `MAX_LABELS_PER_SUBMISSION` in
 * `apps/ensrainbowbeam/src/handlers/submissions.ts`.
 */
export const ENSRAINBOWBEAM_DISCOVER_MAX_LABELS = 100;

/**
 * Must stay in sync with the per-label max length in
 * `apps/ensrainbowbeam/src/handlers/submissions.ts` (`z.string().max(1000)`).
 */
export const ENSRAINBOWBEAM_LABEL_MAX_LENGTH = 1000;

/**
 * Per-label classification status from EnsRainbowBeam.
 *
 * @see apps/ensrainbowbeam/src/lib/labels.ts — `LabelStatus`
 */
export type DiscoverLabelStatus = "unknown_in_index" | "healed_in_index" | "absent_from_index";

export type DiscoverResultItem = {
  rawLabel: LiteralLabel;
  labelHash: LabelHash;
  normalizedLabel?: LiteralLabel;
  normalizedLabelHash?: LabelHash;
  status: DiscoverLabelStatus;
};

export type DiscoverResponse = {
  callerAddress: NormalizedAddress;
  results: DiscoverResultItem[];
};

export type EnsRainbowBeamHealthResponse = {
  message: "ok";
};

export class EnsRainbowBeamHttpError extends Error {
  readonly name = "EnsRainbowBeamHttpError";

  readonly status: number;

  readonly statusText: string;

  readonly details?: unknown;

  constructor(message: string, status: number, statusText = "", details?: unknown) {
    super(message);
    this.status = status;
    this.statusText = statusText;
    if (details !== undefined) {
      this.details = details;
    }
  }
}

export type EnsRainbowBeamClientOptions = {
  /**
   * EnsRainbowBeam HTTP origin. Defaults to {@link DEFAULT_ENSRAINBOWBEAM_URL}.
   */
  baseUrl?: URL | string;

  /**
   * `fetch` implementation (defaults to `globalThis.fetch`).
   */
  fetch?: typeof fetch;
};

function toBaseUrl(url: URL | string | undefined): URL {
  if (url === undefined) {
    return new URL(DEFAULT_ENSRAINBOWBEAM_URL);
  }
  return typeof url === "string" ? new URL(url) : url;
}

export function validateDiscoverParams(params: { labels: string[]; callerAddress: string }): {
  labels: string[];
  callerAddress: NormalizedAddress;
} {
  const { labels, callerAddress } = params;

  if (!Array.isArray(labels) || labels.length === 0) {
    throw new Error("labels must be a non-empty array");
  }
  if (labels.length > ENSRAINBOWBEAM_DISCOVER_MAX_LABELS) {
    throw new Error(
      `labels must contain at most ${ENSRAINBOWBEAM_DISCOVER_MAX_LABELS} items (received ${labels.length})`,
    );
  }

  for (let i = 0; i < labels.length; i++) {
    const label = labels[i];
    if (typeof label !== "string") {
      throw new Error(`labels[${i}] must be a string`);
    }
    if (label.length === 0) {
      throw new Error(`labels[${i}] must be non-empty`);
    }
    if (label.length > ENSRAINBOWBEAM_LABEL_MAX_LENGTH) {
      throw new Error(`labels[${i}] exceeds maximum length ${ENSRAINBOWBEAM_LABEL_MAX_LENGTH}`);
    }
  }

  return {
    labels,
    callerAddress: toNormalizedAddress(callerAddress),
  };
}

async function throwIfNotOk(response: Response): Promise<void> {
  if (response.ok) return;

  let message = `EnsRainbowBeam request failed (HTTP ${response.status})`;
  let details: unknown;

  try {
    const data: unknown = await response.json();
    if (
      data !== null &&
      typeof data === "object" &&
      "message" in data &&
      typeof (data as { message: unknown }).message === "string"
    ) {
      message = (data as { message: string }).message;
      if ("details" in data) {
        details = (data as { details: unknown }).details;
      }
    }
  } catch {
    // ignore non-JSON bodies
  }

  throw new EnsRainbowBeamHttpError(message, response.status, response.statusText, details);
}

export class EnsRainbowBeamClient {
  private readonly baseUrl: URL;

  private readonly fetchImpl: typeof fetch;

  constructor(options: EnsRainbowBeamClientOptions = {}) {
    this.baseUrl = toBaseUrl(options.baseUrl);
    this.fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis);
  }

  async health(signal?: AbortSignal): Promise<EnsRainbowBeamHealthResponse> {
    const response = await this.fetchImpl(new URL("/health", this.baseUrl), { signal });
    await throwIfNotOk(response);
    return response.json() as Promise<EnsRainbowBeamHealthResponse>;
  }

  async discover(
    params: { labels: string[]; callerAddress: string },
    signal?: AbortSignal,
  ): Promise<DiscoverResponse> {
    const { labels, callerAddress } = validateDiscoverParams(params);

    const response = await this.fetchImpl(new URL("/api/discover", this.baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ labels, callerAddress }),
      signal,
    });

    await throwIfNotOk(response);
    return response.json() as Promise<DiscoverResponse>;
  }
}
