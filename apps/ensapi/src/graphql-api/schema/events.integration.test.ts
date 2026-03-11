/**
 * The columns that define the stable sort order for events, mirroring the composite index on the
 * events table.
 */
// const EVENT_SORT_COLUMNS = [
//   schema.event.timestamp,
//   schema.event.chainId,
//   schema.event.blockNumber,
//   schema.event.transactionIndex,
//   schema.event.logIndex,
//   schema.event.id,
// ] as const;

// import { gql } from "graphql-request";
import { describe } from "vitest";

// const DEVNET_DEPLOYER = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

describe.todo("Account.events", () => {
  // TODO: test that the devnet deployer has some events
  // TODO: move the DEVNET_DEPLOYER and DEVNET_USER etc to a integration testing constants
  // apps/ensapi/src/test/integration/devnet.ts
  // and put the content in devnet-names into devnet.ts
});

describe.todo("Account.events pagination", () => {
  // TODO: testEventsPagination...
});
