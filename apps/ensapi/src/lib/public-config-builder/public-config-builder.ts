import config from "@/config";

import {
  type EnsApiPublicConfig,
  type EnsDbClientQuery,
  validateEnsApiPublicConfig,
} from "@ensnode/ensnode-sdk";
import { canFallbackToTheGraph } from "@ensnode/ensnode-sdk/internal";

export class PublicConfigBuilder {
  /**
   * ENSRainbow Client
   *
   * Used to fetch ENSRainbow Public Config, which is part of
   * the ENSApi Public Config.
   */
  private ensDbClient: EnsDbClientQuery;

  /**
   * Immutable ENSApi Public Config
   *
   * The cached ENSApi Public Config object, which is built and validated
   * on the first call to `getPublicConfig()`, and returned as-is on subsequent calls.
   */
  private immutablePublicConfig: EnsApiPublicConfig | undefined;

  /**
   * @param ensDbClient ENSDb Client instance used to fetch ENSDb Public Config
   */
  constructor(ensDbClient: EnsDbClientQuery) {
    this.ensDbClient = ensDbClient;
  }

  /**
   * Get ENSApi Public Config
   *
   * Note: ENSApi Public Config is cached after the first call, so
   * subsequent calls will return the cached version without rebuilding it.
   *
   * @throws if the built ENSApi Public Config does not conform to
   *         the expected schema
   */
  async getPublicConfig(): Promise<EnsApiPublicConfig> {
    if (typeof this.immutablePublicConfig === "undefined") {
      const ensIndexerPublicConfig = await this.ensDbClient.getEnsIndexerPublicConfig();

      // Invariant: the ENSIndexer Public Config is guaranteed to be available in ENSDb
      if (typeof ensIndexerPublicConfig === "undefined") {
        throw new Error("ENSDb must contain an ENSIndexer Public Config");
      }

      this.immutablePublicConfig = validateEnsApiPublicConfig({
        version: config.version,
        theGraphFallback: canFallbackToTheGraph({
          namespace: config.namespace,
          // NOTE: very important here that we replace the actual server-side api key with a placeholder
          // so that it's not sent to clients as part of the `theGraphFallback.url`. The placeholder must
          // pass validation, of course, but the only validation necessary is that it is a string.
          theGraphApiKey: config.theGraphApiKey ? "<API_KEY>" : undefined,
          isSubgraphCompatible: ensIndexerPublicConfig.isSubgraphCompatible,
        }),
        ensIndexerPublicConfig,
      });
    }

    return this.immutablePublicConfig;
  }
}
