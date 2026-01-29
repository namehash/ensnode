import { and, asc, desc, eq, gt, lt } from "drizzle-orm";
import { unionAll } from "drizzle-orm/pg-core";
import type { Address } from "viem";

import * as schema from "@ensnode/ensnode-schema";

import { db } from "@/lib/db";
import { makeLogger } from "@/lib/logger";

const logger = makeLogger("find-domains");

interface DomainFilter {
  name?: string;
  owner?: Address;
}

/**
 * Find Domains by Canonical Name.
 *
 * ## Terminology:
 *
 * - a 'Canonical Domain' is a Domain connected to either the ENSv1 Root or the ENSv2 Root. All ENSv1
 *  Domains are Canonical Domains, but an ENSv2 Domain may not be Canonical, for example if it exists
 *  in a disjoint nametree or its Registry does not declare a Canonical Domain.
 * - a 'Partial InterpretedName' is a partial InterpretedName (ex: 'examp', 'example.', 'sub1.sub2.paren')
 *
 * ## Background:
 *
 * Materializing the set of Canonical Names in ENSv2 is non-trivial and more or less impossible
 * within the confines of Ponder's cache semantics. Additionally retroactive label healing (due to
 * new labels being discovered on-chain) is likely impossible within those constraints as well. If we
 * were to implement a naive cache-unfriendly version of canonical name materialization, indexing time
 * would increase dramatically.
 *
 * The overall user story we're trying to support is 'autocomplete' or 'search (my) domains'. More
 * specifically, given a partial InterpretedName as input (ex: 'examp', 'example.', 'sub1.sub2.paren'),
 * produce a set of Domains addressable by the provided partial InterpretedName.
 *
 * While complicated to do so, it is more correct to perform this calculation at query-time rather
 * than at index-time, given the constraints above.
 *
 * ## Algorithm
 *
 * - 'og.shru' as input.
 * - start with all domains that are addressable by the completed portion
 *   - must support recursion like `sub1.sub2.pare`
 * - given that set of domains, then find domains addressable by that path for whom the next step
 *   is LIKE the partial label joined against both domains tables
 * - find all labels like leaf with index
 * - join into both domains tables to find all domains that use that label
 * - filter by domains that
 * - then for each domain, validate
 */
export function findDomains({ name, owner }: DomainFilter) {
  // one of name or owner must be provided
  if (name === undefined && owner === undefined) {
    throw new Error(`One of 'name' or 'owner' must be provided.`);
  }

  // TODO: figure out how to cast this column as DomainId so the union typing is more accurate
  const v1DomainsByOwner = db
    .select({ id: schema.v1Domain.id })
    .from(schema.v1Domain)
    .where(owner && eq(schema.v1Domain.ownerId, owner));

  const v2DomainsByOwner = db
    .select({ id: schema.v2Domain.id })
    .from(schema.v2Domain)
    .where(owner && eq(schema.v2Domain.ownerId, owner));

  // join labels for each
  const v1Domains = v1DomainsByOwner //
    .leftJoin(schema.label, eq(schema.v1Domain.labelHash, schema.label.labelHash));

  const v2Domains = v2DomainsByOwner //
    .leftJoin(schema.label, eq(schema.v2Domain.labelHash, schema.label.labelHash));

  // use any to ignore id column type mismatch (ENSv1DomainId & ENSv2DomainId)
  const domains = db.$with("domains").as(unionAll(v1DomainsByOwner, v2DomainsByOwner as any));

  return domains;
}

// async function findV1Domains({ name, owner }: DomainFilter) {
//   // one of name or owner must be provided
//   if (name === undefined && owner === undefined) {
//     throw new Error(`One of 'name' or 'owner' must be provided.`);
//   }

// }

// async function findV2Domains({ name, owner }: DomainFilter) {
//   //
// }
