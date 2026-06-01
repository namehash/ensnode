import { defineCommand } from "citty";

import { EnsRainbowApiClient } from "@ensnode/ensrainbow-sdk";

import { outputArgs, rainbowArgs } from "../../lib/args";
import { resolveEnsRainbowUrl } from "../../lib/config";
import { printResult, runSafely } from "../../lib/output";

export const count = defineCommand({
  meta: {
    name: "count",
    description: "Report the number of healable labels known to ENSRainbow",
  },
  args: {
    ...rainbowArgs,
    ...outputArgs,
  },
  run: ({ args }) =>
    runSafely(async () => {
      const client = new EnsRainbowApiClient({ endpointUrl: resolveEnsRainbowUrl(args) });
      const result = await client.count();
      printResult(result, args);
    }),
});
