import { ponder } from "ponder:registry";
import schema from "ponder:schema";
import { eq } from "ponder";

import {
  type LiteralLabel,
  literalLabelToInterpretedLabel,
  PluginName,
} from "@ensnode/ensnode-sdk";
import { ErrorCode, StatusCode } from "@ensnode/ensrainbow-sdk";

import { getENSRainbowApiClient } from "@/lib/ensraibow-api-client";
import { namespaceContract } from "@/lib/plugin-helpers";

const pluginName = PluginName.ENSv2;

const BATCH_SIZE = 1000;
const ensrainbow = getENSRainbowApiClient();

export default function () {
  // this ended up being slower than otherwise, because it runs for every block even in backfill
  // and the overhead of the "get unhealed labels that need healing" query is killing any performance
  // gain from batching ensrainbow heals. keeping code here for now just in case
  //
  // ponder.on(
  //   namespaceContract(pluginName, "ENSRainbowBatchHeal:block"),
  //   async ({ context, event }) => {
  //     while (true) {
  //       const unhealed = await context.db.sql
  //         .select()
  //         .from(schema.label)
  //         .where(eq(schema.label.needsHeal, true))
  //         .limit(BATCH_SIZE);
  //       if (unhealed.length === 0) return;
  //       console.log(`Healing ${unhealed.length} labels in block ${event.block.number}`);
  //       // TODO: ENSRainbow batchHeal
  //       let now = performance.now();
  //       const results = await Promise.all(
  //         unhealed.map(async ({ labelHash }) => ({
  //           labelHash,
  //           response: await ensrainbow.heal(labelHash),
  //         })),
  //       );
  //       console.log(`ensrainbow duration: ${performance.now() - now}ms`);
  //       // NOTE: transactions/batch not supported by Ponder's Postgres Proxy Driver
  //       now = performance.now();
  //       for (const { labelHash, response } of results) {
  //         switch (response.status) {
  //           case StatusCode.Success: {
  //             const interpretedLabel = literalLabelToInterpretedLabel(
  //               response.label as LiteralLabel,
  //             );
  //             await context.db.sql
  //               .update(schema.label)
  //               .set({ value: interpretedLabel, needsHeal: false })
  //               .where(eq(schema.label.labelHash, labelHash));
  //             break;
  //           }
  //           case "error": {
  //             switch (response.errorCode) {
  //               case ErrorCode.BadRequest:
  //               case ErrorCode.NotFound: {
  //                 await context.db.sql
  //                   .update(schema.label)
  //                   .set({ needsHeal: false })
  //                   .where(eq(schema.label.labelHash, labelHash));
  //                 break;
  //               }
  //               case ErrorCode.ServerError: {
  //                 // this requires ENSRainbow to be available, does not tolerate downtime
  //                 // ideally instead we can do some sort of queue for failed tasks...
  //                 throw new Error(
  //                   `Error healing labelHash: "${labelHash}". Error (${response.errorCode}): ${response.error}.`,
  //                 );
  //               }
  //             }
  //           }
  //         }
  //       }
  //       console.log(`update duration: ${performance.now() - now}ms`);
  //     }
  //   },
  // );
}
