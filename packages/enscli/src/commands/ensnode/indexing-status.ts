import { defineCommand } from "citty";

import { EnsNodeClient, serializeEnsApiIndexingStatusResponse } from "@ensnode/ensnode-sdk";

import { ensnodeArgs, outputArgs } from "../../lib/args";
import { resolveEnsNodeUrl } from "../../lib/config";
import { printResult, runSafely } from "../../lib/output";

export const indexingStatus = defineCommand({
  meta: {
    name: "indexing-status",
    description: "Fetch the indexing status of an ENSNode instance",
  },
  args: {
    ...ensnodeArgs,
    ...outputArgs,
  },
  run: ({ args }) =>
    runSafely(async () => {
      const url = resolveEnsNodeUrl(args);
      const client = new EnsNodeClient({ url });
      // `indexingStatus()` returns the deserialized form (whose `omnichainSnapshot.chains` is a Map,
      // which JSON.stringify drops); serialize back to the JSON-safe wire shape before printing.
      const status = await client.indexingStatus();
      printResult(serializeEnsApiIndexingStatusResponse(status), args);
    }),
});
