import type { ENSIndexerEnvironment } from "@/config/types";

declare global {
  namespace NodeJS {
    interface ProcessEnv extends ENSIndexerEnvironment {}
  }
}
