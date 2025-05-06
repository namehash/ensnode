import { MergedTypes } from "@/lib/plugin-helpers";
import * as basenamesPlugin from "./basenames/basenames.plugin";
import * as lineaNamesPlugin from "./lineanames/lineanames.plugin";
import * as subgraphPlugin from "./subgraph/subgraph.plugin";
import * as threednsPlugin from "./threedns/threedns.plugin";

/**
 * All available plugins for the ENSIndexer.
 */
export const AVAILABLE_PLUGINS = [
  subgraphPlugin,
  basenamesPlugin,
  lineaNamesPlugin,
  threednsPlugin,
] as const;

export type MergedPluginConfig = MergedTypes<(typeof AVAILABLE_PLUGINS)[number]["config"]> & {
  /**
   * The environment variables that change the behavior of the indexer.
   * It's important to include all environment variables that change the behavior
   * of the indexer to ensure Ponder app build ID is updated when any of them change.
   **/
  indexingBehaviorDependencies: {
    HEAL_REVERSE_ADDRESSES: boolean;
  };
};
