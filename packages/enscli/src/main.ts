import { defineCommand } from "citty";

import { ensnode } from "./commands/ensnode/index";
import { ensrainbow } from "./commands/ensrainbow/index";
import { labelhash } from "./commands/labelhash";
import { namehash } from "./commands/namehash";

export const main = defineCommand({
  meta: {
    name: "enscli",
    description:
      "An agent- and human-friendly CLI for ENS. Outputs JSON when piped, pretty in a TTY. Read-only.",
  },
  subCommands: {
    ensnode,
    ensrainbow,
    namehash,
    labelhash,
  },
});
