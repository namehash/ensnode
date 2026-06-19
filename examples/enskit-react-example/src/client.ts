import { createEnsNodeClient } from "enssdk/core";
import { omnigraph } from "enssdk/omnigraph";

export function createOmnigraphEnsNodeClient(url: string) {
  return createEnsNodeClient({ url }).extend(omnigraph);
}

export type OmnigraphEnsNodeClient = ReturnType<typeof createOmnigraphEnsNodeClient>;
