import { defineCommand } from "citty";

import { EnsNodeClient } from "@ensnode/ensnode-sdk";

import { connectionArgs, outputArgs } from "../../lib/args";
import { resolveEnsNodeUrl } from "../../lib/config";
import { printResult, runSafely } from "../../lib/output";

export const indexingStatus = defineCommand({
  meta: {
    name: "indexing-status",
    description: "Fetch the indexing status of an ENSNode instance",
  },
  args: {
    ...connectionArgs,
    ...outputArgs,
  },
  run: ({ args }) =>
    runSafely(async () => {
      const url = resolveEnsNodeUrl(args);
      const client = new EnsNodeClient({ url });
      const status = await client.indexingStatus();
      printResult(status, args);
    }),
});
