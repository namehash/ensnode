/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENSNODE_URL?: string;
  readonly VITE_ENS_NAMESPACE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
