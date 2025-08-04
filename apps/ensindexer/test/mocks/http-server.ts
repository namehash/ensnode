import { EnsRainbow } from "@ensnode/ensrainbow-sdk";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

export const server = setupServer(
  /**
   * Mock HTTP response for ENSRainbow.
   *
   * It is required for during the ENSIndexer bootstrap phase.
   */
  http.get("https://customrainbow.com/v1/version", () => {
    return HttpResponse.json({
      status: "success",
      versionInfo: { version: "0.31.0", schema_version: 2 },
    } satisfies EnsRainbow.VersionResponse);
  }),
);
