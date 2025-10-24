import type { ENSIndexerEnvironment } from "@/config/environment";

declare global {
  namespace NodeJS {
    interface ProcessEnv extends ENSIndexerEnvironment {}
  }
}
