/// <reference types="node" />

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      THEGRAPH_API_KEY_SECRET_ID?: string;
      CLOUDFLARE_SECRET?: string;
    }
  }
}
