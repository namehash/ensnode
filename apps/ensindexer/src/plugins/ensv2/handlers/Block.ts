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

const BATCH_SIZE = 100;
const ensrainbow = getENSRainbowApiClient();

export default function () {
  ponder.on(namespaceContract(pluginName, "ENSRainbowBatchHeal:block"), async ({ context }) => {
    while (true) {
      const unhealed = await context.db.sql
        .select()
        .from(schema.label)
        .where(eq(schema.label.needsHeal, true))
        .limit(BATCH_SIZE);

      if (unhealed.length === 0) break;

      // TODO: ENSRainbow batchHeal(unhealed)
      const results = await Promise.all(
        unhealed.map(async ({ labelHash }) => ({
          labelHash,
          response: await ensrainbow.heal(labelHash),
        })),
      );

      // NOTE: transactions/batch not supported by Ponder's Postgres Proxy Driver
      for (const { labelHash, response } of results) {
        switch (response.status) {
          case StatusCode.Success: {
            const interpretedLabel = literalLabelToInterpretedLabel(response.label as LiteralLabel);
            return context.db.sql
              .update(schema.label)
              .set({ value: interpretedLabel, needsHeal: false })
              .where(eq(schema.label.labelHash, labelHash));
          }
          case "error": {
            switch (response.errorCode) {
              case ErrorCode.BadRequest:
              case ErrorCode.NotFound: {
                return context.db.sql
                  .update(schema.label)
                  .set({ needsHeal: false })
                  .where(eq(schema.label.labelHash, labelHash));
              }
              case ErrorCode.ServerError: {
                // simply no-op ServerErrors so we try again in the next block
              }
            }
          }
        }
      }
    }
  });
}
