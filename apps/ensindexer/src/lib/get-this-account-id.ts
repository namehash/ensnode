import type { Context } from "ponder:registry";

import type { AccountId } from "@ensnode/ensnode-sdk";

import type { LogEvent } from "@/lib/ponder-helpers";

export const getThisAccountId = (context: Context, event: Pick<LogEvent, "log">) =>
  ({ chainId: context.chain.id, address: event.log.address }) satisfies AccountId;
