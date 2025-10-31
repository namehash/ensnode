import type { LogLevelEnvironment } from "@ensnode/ensnode-sdk/internal";

declare global {
  namespace NodeJS {
    interface ProcessEnv extends LogLevelEnvironment {}
  }
}
