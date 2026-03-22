import type { ENSIndexerEnvironment } from "@/config/environment";

declare global {
  namespace NodeJS {
    interface ProcessEnv extends ENSIndexerEnvironment {}
  }

  /**
   * Global variable injected by Ponder at runtime,
   * containing internal context of the local Ponder app.
   *
   * @see https://github.com/ponder-sh/ponder/blob/6fcc15d4234e43862cb6e21c05f3c57f4c2f7464/packages/core/src/internal/common.ts#L7-L15
   */
  var PONDER_COMMON: {
    options: {
      command: string;
    };
  };
}
