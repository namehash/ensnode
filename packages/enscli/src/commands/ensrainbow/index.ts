import { defineCommand } from "citty";

import { count } from "./count";
import { heal } from "./heal";

export const ensrainbow = defineCommand({
  meta: {
    name: "ensrainbow",
    description: "Interact with an ENSRainbow instance (label healing)",
  },
  subCommands: {
    heal,
    count,
  },
});
