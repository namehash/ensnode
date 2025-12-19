/// <reference types="node" />

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      THEGRAPH_API_KEY_SECRET_NAME?: string;
    }
  }
}
