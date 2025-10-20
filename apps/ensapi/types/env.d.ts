import type { EnsApiEnvironment } from "@/config/environment";

declare global {
  namespace NodeJS {
    interface ProcessEnv extends EnsApiEnvironment {}
  }
}
