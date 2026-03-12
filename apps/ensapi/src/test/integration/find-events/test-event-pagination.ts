import { beforeAll, expect, it } from "vitest";

import type { EventResult } from "@/test/integration/find-events/event-pagination-queries";
import {
  collectBackward,
  collectForward,
  type PaginatedGraphQLConnection,
} from "@/test/integration/graphql-utils";

// NOTE: using small page size to force multiple pages in devnet result set
const PAGE_SIZE = 2;

type FetchPage = (variables: {
  first?: number;
  after?: string;
  last?: number;
  before?: string;
}) => Promise<PaginatedGraphQLConnection<EventResult>>;

/**
 * Asserts that events are in ascending order by their actual metadata columns,
 * matching the composite sort key: [timestamp, chainId, blockNumber, transactionIndex, logIndex].
 *
 * This verifies that the lexicographic id sort matches the underlying data.
 */
function assertAscendingOrder(events: EventResult[]) {
  for (let i = 0; i < events.length - 1; i++) {
    const a = events[i];
    const b = events[i + 1];

    const cmp = compareSortKey(a, b);
    expect(
      cmp <= 0,
      `expected event at index ${i} to sort before event at index ${i + 1}:\n` +
        `  a: timestamp=${a.timestamp} chainId=${a.chainId} block=${a.blockNumber} txIdx=${a.transactionIndex} logIdx=${a.logIndex}\n` +
        `  b: timestamp=${b.timestamp} chainId=${b.chainId} block=${b.blockNumber} txIdx=${b.transactionIndex} logIdx=${b.logIndex}`,
    ).toBe(true);
  }
}

/**
 * Compare two events by their composite sort key columns.
 * Returns negative if a < b, 0 if equal, positive if a > b.
 */
function compareSortKey(a: EventResult, b: EventResult): number {
  // timestamp (bigint comparison)
  const tsA = BigInt(a.timestamp);
  const tsB = BigInt(b.timestamp);
  if (tsA !== tsB) return tsA < tsB ? -1 : 1;

  // chainId
  if (a.chainId !== b.chainId) return a.chainId - b.chainId;

  // blockNumber (bigint comparison)
  const bnA = BigInt(a.blockNumber);
  const bnB = BigInt(b.blockNumber);
  if (bnA !== bnB) return bnA < bnB ? -1 : 1;

  // transactionIndex
  if (a.transactionIndex !== b.transactionIndex) return a.transactionIndex - b.transactionIndex;

  // logIndex
  if (a.logIndex !== b.logIndex) return a.logIndex - b.logIndex;

  // equal sort key (differentiated only by id)
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * Generic pagination test suite for any find-events connection field.
 *
 * Events are always sorted in ascending order by their composite sort key
 * (timestamp, chainId, blockNumber, transactionIndex, logIndex), which is
 * encoded into the event id for lexicographic sorting.
 *
 * Tests forward pagination, ordering correctness (verifying the lexicographic
 * id sort matches the actual metadata), and backward pagination.
 */
export function testEventPagination(fetchPage: FetchPage) {
  let forwardNodes: EventResult[];
  let backwardNodes: EventResult[];

  beforeAll(async () => {
    forwardNodes = await collectForward(fetchPage, PAGE_SIZE);
    backwardNodes = await collectBackward(fetchPage, PAGE_SIZE);
  });

  it("forward pagination collects more nodes than page size", () => {
    expect(
      forwardNodes.length,
      `expected more than ${PAGE_SIZE} nodes to prove pagination was exercised`,
    ).toBeGreaterThan(PAGE_SIZE);
  });

  it("no duplicate ids across pages", () => {
    const ids = forwardNodes.map((e) => e.id);
    expect(ids.length).toBe(new Set(ids).size);
  });

  it("events are in ascending order by sort key columns", () => {
    assertAscendingOrder(forwardNodes);
  });

  it("lexicographic id order matches metadata sort order", () => {
    const ids = forwardNodes.map((e) => e.id);
    const sorted = [...ids].sort();
    expect(ids).toEqual(sorted);
  });

  it("backward pagination yields same nodes in same order", () => {
    expect(backwardNodes).toEqual(forwardNodes);
  });
}
