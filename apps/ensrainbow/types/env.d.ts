import type { ENSRainbowEnvironment } from "@/config/environment";

declare global {
  namespace NodeJS {
    interface ProcessEnv extends ENSRainbowEnvironment {}
  }
}
