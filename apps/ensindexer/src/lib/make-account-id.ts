import type { Context, Event } from "ponder:registry";

import type { AccountId } from "@ensnode/ensnode-sdk";

export const makeAccountId = (context: Context, event: Pick<Event, "log">) =>
  ({ chainId: context.chain.id, address: event.log.address }) satisfies AccountId;
