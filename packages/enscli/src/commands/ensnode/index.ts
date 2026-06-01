import { defineCommand } from "citty";

import { indexingStatus } from "./indexing-status";
import { omnigraph } from "./omnigraph";

export const ensnode = defineCommand({
  meta: {
    name: "ensnode",
    description: "Interact with an ENSNode instance (Omnigraph queries, indexing status)",
  },
  subCommands: {
    omnigraph,
    "indexing-status": indexingStatus,
  },
});
