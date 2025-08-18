import { normalize } from "viem/ens";

import type { Name } from "../ens";

export function isNormalized(name: Name) {
  try {
    return name === normalize(name);
  } catch {
    return false;
  }
}
