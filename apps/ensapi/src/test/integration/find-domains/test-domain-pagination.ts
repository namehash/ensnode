import { beforeAll, describe, expect, it } from "vitest";

import { shouldUseNullsLast } from "@/omnigraph-api/lib/find-domains/find-domains-resolver-helpers";
import type { DomainsOrderByValue, DomainsOrderInput } from "@/omnigraph-api/schema/domain-inputs";
import type { OrderDirectionValue } from "@/omnigraph-api/schema/order-direction";
import type { PaginatedDomainResult } from "@/test/integration/find-domains/domain-pagination-queries";
import {
  collectBackward,
  collectForward,
  type PaginatedGraphQLConnection,
} from "@/test/integration/graphql-utils";

// NOTE: using small page size to force multiple pages in devnet result set
const PAGE_SIZE = 2;

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
  { by: "DEPTH", dir: "ASC" },
  { by: "DEPTH", dir: "DESC" },
  { by: "REGISTRATION_TIMESTAMP", dir: "ASC" },
  { by: "REGISTRATION_TIMESTAMP", dir: "DESC" },
  { by: "REGISTRATION_EXPIRY", dir: "ASC" },
  { by: "REGISTRATION_EXPIRY", dir: "DESC" },
];

function getSortValue(
  domain: PaginatedDomainResult,
  by: DomainsOrderByValue,
): string | number | null {
  switch (by) {
    case "NAME":
      return domain.canonical?.name.interpreted ?? null;
    case "DEPTH":
      return domain.canonical?.depth ?? null;
    case "REGISTRATION_TIMESTAMP":
      return domain.registration?.start ?? null;
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

  // Registration orderings use SQL-default NULL placement (ASC → last, DESC → first); NAME/DEPTH
  // keep NULLS LAST in both directions. See find-domains-resolver-helpers.ts.
  const nullsFirst = !shouldUseNullsLast(by) && dir === "DESC";

  for (let i = 0; i < values.length - 1; i++) {
    const a = values[i];
    const b = values[i + 1];

    if (nullsFirst) {
      // nulls first: a non-null must not be followed by a null
      if (b === null) {
        expect(
          a,
          `expected null at index ${i} because index ${i + 1} was null (nulls first)`,
        ).toBeNull();
        continue;
      }
      // a is null, b is non-null => fine (null sorts first)
      if (a === null) continue;
    } else {
      // nulls last: a null must be followed only by nulls
      if (a === null) {
        expect(
          b,
          `expected null at index ${i + 1} because index ${i} was null (nulls last)`,
        ).toBeNull();
        continue;
      }
      // a is non-null, b is null => fine (null sorts last)
      if (b === null) continue;
    }

    if (by === "NAME") {
      const av = a as string;
      const bv = b as string;
      // Use localeCompare with ignorePunctuation to match Postgres ICU collation, which treats
      // punctuation (including ".") as variable/ignorable at the primary level. Without this,
      // JS bytewise ordering disagrees with the DB for names like "onion3.x" vs "onion.x":
      // Postgres sorts "onion3" before "onion." (digits < letters after stripping dots), while
      // JS places "." (code 46) before "3" (code 51).
      if (dir === "ASC") {
        expect(
          av.localeCompare(bv, undefined, { ignorePunctuation: true }) <= 0,
          `expected "${av}" <= "${bv}" at indices ${i},${i + 1} (NAME ASC)`,
        ).toBe(true);
      } else {
        expect(
          av.localeCompare(bv, undefined, { ignorePunctuation: true }) >= 0,
          `expected "${av}" >= "${bv}" at indices ${i},${i + 1} (NAME DESC)`,
        ).toBe(true);
      }
    } else if (by === "DEPTH") {
      const av = a as number;
      const bv = b as number;
      if (dir === "ASC") {
        expect(av <= bv, `expected ${av} <= ${bv} at indices ${i},${i + 1} (DEPTH ASC)`).toBe(true);
      } else {
        expect(av >= bv, `expected ${av} >= ${bv} at indices ${i},${i + 1} (DEPTH DESC)`).toBe(
          true,
        );
      }
    } else {
      // bigint string comparison
      const av = BigInt(a as string);
      const bv = BigInt(b as string);
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

/**
 * Generic pagination test suite for any find-domains connection field.
 *
 * Generates describe/it blocks for all 6 ordering permutations, testing forward pagination,
 * ordering correctness, and backward pagination.
 */
export function testDomainPagination(fetchPage: FetchPage) {
  for (const order of ORDER_PERMUTATIONS) {
    describe(`order: ${order.by} ${order.dir}`, () => {
      let forwardNodes: PaginatedDomainResult[];
      let backwardNodes: PaginatedDomainResult[];

      beforeAll(async () => {
        forwardNodes = await collectForward((vars) => fetchPage({ order, ...vars }), PAGE_SIZE);
        backwardNodes = await collectBackward((vars) => fetchPage({ order, ...vars }), PAGE_SIZE);
      });

      it("forward pagination collects more nodes than page size", () => {
        expect(
          forwardNodes.length,
          `expected more than ${PAGE_SIZE} nodes to prove pagination was exercised`,
        ).toBeGreaterThan(PAGE_SIZE);
      });

      it("no duplicate ids across pages", () => {
        const ids = forwardNodes.map((d) => d.id);
        expect(ids.length).toBe(new Set(ids).size);
      });

      it("nodes are correctly ordered", () => {
        assertOrdering(forwardNodes, order.by, order.dir);
      });

      it("backward pagination yields same nodes in same order", () => {
        expect(backwardNodes).toEqual(forwardNodes);
      });
    });
  }
}
