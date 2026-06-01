import { defineCommand } from "citty";

import { EnsRainbowApiClient } from "@ensnode/ensrainbow-sdk";

import { outputArgs, rainbowArgs } from "../../lib/args";
import { resolveEnsRainbowUrl } from "../../lib/config";
import { printResult, runSafely } from "../../lib/output";
import { assertCleanIdentifier } from "../../lib/validate";

export const heal = defineCommand({
  meta: {
    name: "heal",
    description: "Heal a labelHash to its original label via ENSRainbow",
  },
  args: {
    labelhash: {
      type: "positional",
      required: true,
      description: "The labelHash to heal (0x… or an encoded [hash])",
    },
    ...rainbowArgs,
    ...outputArgs,
  },
  run: ({ args }) =>
    runSafely(async () => {
      assertCleanIdentifier(args.labelhash, "labelhash");
      const client = new EnsRainbowApiClient({ endpointUrl: resolveEnsRainbowUrl(args) });
      const result = await client.heal(args.labelhash);
      printResult(result, args);
    }),
});
