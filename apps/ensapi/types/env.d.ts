import type { EnsApiEnvironment } from "@/config/types";

declare global {
  namespace NodeJS {
    interface ProcessEnv extends EnsApiEnvironment {}
  }
}
