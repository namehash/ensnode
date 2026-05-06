import { ensDbClient } from "@/lib/ensdb/singleton";
import { ensRainbowClient } from "@/lib/ensrainbow/singleton";
import { publicConfigBuilder } from "@/lib/public-config-builder/singleton";
import { StackInfoBuilder } from "@/lib/stack-info-builder/stack-info-builder";

/**
 * Singleton {@link StackInfoBuilder} instance to use across ENSIndexer modules.
 */
export const stackInfoBuilder = new StackInfoBuilder(
  ensDbClient,
  ensRainbowClient,
  publicConfigBuilder,
);
