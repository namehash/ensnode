import type { ENSIndexerEnvironment } from "@/config/environment";
import type { RawPonderAppContext } from "@ensnode/ponder-sdk";

declare global {
  namespace NodeJS {
    interface ProcessEnv extends ENSIndexerEnvironment {}
  }
  /**
   * The "raw" context of the local Ponder app.
   */
  var PONDER_COMMON: RawPonderAppContext | undefined;
}
