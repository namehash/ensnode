import { defineCommand } from "citty";

import { datasources } from "./commands/datasources/index";
import { ensnode } from "./commands/ensnode/index";
import { ensrainbow } from "./commands/ensrainbow/index";
import { labelhash } from "./commands/labelhash";
import { namehash } from "./commands/namehash";

export const main = defineCommand({
  meta: {
    name: "enscli",
    description: "An agent- and human-friendly CLI for ENS, ENSNode, and the Omnigraph API.",
  },
  subCommands: {
    ensnode,
    ensrainbow,
    datasources,
    namehash,
    labelhash,
  },
});
