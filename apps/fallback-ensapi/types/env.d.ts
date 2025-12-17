/// <reference types="node" />

import type { TheGraphEnvironment } from "@ensnode/ensnode-sdk/internal";

declare global {
  namespace NodeJS {
    interface ProcessEnv extends TheGraphEnvironment {}
  }
}
