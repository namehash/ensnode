import { defineCommand } from "citty";

import { dump } from "./commands/dump";
import { load } from "./commands/load";

export const main = defineCommand({
  meta: {
    name: "ensdb-cli",
    description:
      "Dump/load ENSIndexer schemas (and their ENSNode metadata) between ENSDb instances.",
  },
  subCommands: {
    dump,
    load,
  },
});
