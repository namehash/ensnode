import { beforeAll, describe, expect, it } from "vitest";

import type { DomainsOrderByValue, DomainsOrderInput } from "@/graphql-api/schema/domain";
import type { OrderDirectionValue } from "@/graphql-api/schema/order-direction";
import type { PaginatedDomainResult } from "@/test/integration/domain-pagination-queries";
import {
  flattenConnection,
  type PaginatedGraphQLConnection,
} from "@/test/integration/graphql-utils";

type FetchPageVariables = {
  order: typeof DomainsOrderInput.$inferInput;
  first?: number;
  after?: string;
  last?: number;
  before?: string;
};

type FetchPage = (
  variables: FetchPageVariables,
) => Promise<PaginatedGraphQLConnection<PaginatedDomainResult>>;

const ORDER_PERMUTATIONS: Array<{ by: DomainsOrderByValue; dir: OrderDirectionValue }> = [
  { by: "NAME", dir: "ASC" },
  { by: "NAME", dir: "DESC" },
  { by: "REGISTRATION_TIMESTAMP", dir: "ASC" },
  { by: "REGISTRATION_TIMESTAMP", dir: "DESC" },
  { by: "REGISTRATION_EXPIRY", dir: "ASC" },
  { by: "REGISTRATION_EXPIRY", dir: "DESC" },
];

function getSortValue(domain: PaginatedDomainResult, by: DomainsOrderByValue): string | null {
  switch (by) {
    case "NAME":
      return domain.label.interpreted;
    case "REGISTRATION_TIMESTAMP":
      return domain.registration?.event.timestamp ?? null;
    case "REGISTRATION_EXPIRY":
      return domain.registration?.expiry ?? null;
  }
}

function assertOrdering(
  domains: PaginatedDomainResult[],
  by: DomainsOrderByValue,
  dir: OrderDirectionValue,
) {
  const values = domains.map((n) => getSortValue(n, by));

  for (let i = 0; i < values.length - 1; i++) {
    const a = values[i];
    const b = values[i + 1];

    // nulls sort last regardless of direction
    if (a === null) {
      // a is null => b must also be null (everything after should be null)
      expect(
        b,
        `expected null at index ${i + 1} because index ${i} was null (nulls last)`,
      ).toBeNull();
      continue;
    }
    if (b === null) {
      // a is non-null, b is null => fine (null sorts last)
      continue;
    }

    if (by === "NAME") {
      if (dir === "ASC") {
        expect(a <= b, `expected "${a}" <= "${b}" at indices ${i},${i + 1} (NAME ASC)`).toBe(true);
      } else {
        expect(a >= b, `expected "${a}" >= "${b}" at indices ${i},${i + 1} (NAME DESC)`).toBe(true);
      }
    } else {
      // bigint string comparison
      const av = BigInt(a);
      const bv = BigInt(b);
      if (dir === "ASC") {
        expect(av <= bv, `expected ${av} <= ${bv} at indices ${i},${i + 1} (${by} ASC)`).toBe(true);
      } else {
        expect(av >= bv, `expected ${av} >= ${bv} at indices ${i},${i + 1} (${by} DESC)`).toBe(
          true,
        );
      }
    }
  }
}

async function collectForward(
  fetchPage: FetchPage,
  order: typeof DomainsOrderInput.$inferInput,
  pageSize: number,
): Promise<PaginatedDomainResult[]> {
  const all: PaginatedDomainResult[] = [];
  let after: string | undefined;

  while (true) {
    const page = await fetchPage({ order, first: pageSize, after });
    all.push(...flattenConnection(page));

    if (!page.pageInfo.hasNextPage) break;

    const nextCursor = page.pageInfo.endCursor ?? undefined;
    expect(nextCursor, "endCursor must advance when hasNextPage is true").not.toBe(after);
    after = nextCursor;
  }

  return all;
}

async function collectBackward(
  fetchPage: FetchPage,
  order: typeof DomainsOrderInput.$inferInput,
  pageSize: number,
): Promise<PaginatedDomainResult[]> {
  const all: PaginatedDomainResult[] = [];
  let before: string | undefined;

  while (true) {
    const page = await fetchPage({ order, last: pageSize, before });
    // prepend: last pages come in forward order within the page,
    // but we're iterating from the end of the full list
    all.unshift(...flattenConnection(page));

    if (!page.pageInfo.hasPreviousPage) break;

    const nextCursor = page.pageInfo.startCursor ?? undefined;
    expect(nextCursor, "startCursor must advance when hasPreviousPage is true").not.toBe(before);
    before = nextCursor;
  }

  return all;
}

// NOTE: using small page size to force multiple pages in devnet result set
const PAGE_SIZE = 2;

/**
 * Generic pagination test suite for any find-domains connection field.
 *
 * Generates describe/it blocks for all 6 ordering permutations, testing forward pagination,
 * ordering correctness, and backward pagination.
 */
export function testDomainPagination(fetchPage: FetchPage) {
  for (const order of ORDER_PERMUTATIONS) {
    describe(`order: ${order.by} ${order.dir}`, async () => {
      let forwardNodes: PaginatedDomainResult[];
      let backwardNodes: PaginatedDomainResult[];

      beforeAll(async () => {
        forwardNodes = await collectForward(fetchPage, order, PAGE_SIZE);
        backwardNodes = await collectBackward(fetchPage, order, PAGE_SIZE);
      });

      it("forward pagination collects all nodes", async () => {
        expect(forwardNodes.length).toBeGreaterThan(0);
      });

      it("nodes are correctly ordered", () => {
        assertOrdering(forwardNodes, order.by, order.dir);
      });

      it("backward pagination yields same nodes in same order", async () => {
        expect(backwardNodes).toEqual(forwardNodes);
      });
    });
  }
}
