import { defineCommand } from "citty";

import { identify } from "./identify";

export const datasources = defineCommand({
  meta: {
    name: "datasources",
    description: "Inspect the ENS datasource catalog",
  },
  subCommands: {
    identify,
  },
});
