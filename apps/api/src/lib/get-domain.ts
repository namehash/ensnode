import { sql } from "drizzle-orm";

import { CAIP10AccountId, LabelHash } from "@ensnode/utils/types";
import { HTTPException } from "hono/http-exception";
import { hexToBigInt } from "viem";
import { db, schema } from "./db";
import { parseName } from "./parse-name";

// TODO: configure this correctly, likely constructing the root registry id from the relevant ens deployment
const ROOT_REGISTRY = "eip155:11155111:0xc44D7201065190B290Aaaf6efaDFD49d530547A3";

// TODO: de-duplicate these helpers with @ensnode/utils
const LABEL_HASH_MASK = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffff00000000n;
const maskTokenId = (tokenId: bigint) => tokenId & LABEL_HASH_MASK;
const labelHashToTokenId = (labelHash: LabelHash) => hexToBigInt(labelHash, { size: 32 });

/**
 * gets a Domain from the tree if it exists using recursive CTE, traversing from RootRegistry
 */
export async function getDomainAndPath(name: string) {
  const tokenIds = parseName(name) // given a set of labelhashes
    .toReversed() // reverse for path
    .map((labelHash) => maskTokenId(labelHashToTokenId(labelHash))); // convert to masked bigint tokenId

  if (tokenIds.length === 0) {
    throw new Error(`getDomainAndPath: name "${name}" did not contain any segments?`);
  }

  console.log({
    name,
    tokenIdsReversed: tokenIds,
  });

  // https://github.com/drizzle-team/drizzle-orm/issues/1289
  // https://github.com/drizzle-team/drizzle-orm/issues/1589
  const rawTokenIdsArray = sql.raw(`ARRAY[${tokenIds.join(", ")}]::numeric[]`);

  const result = await db.execute(sql`
    WITH RECURSIVE path_traversal AS (
      -- Base case: Start with RootRegistry
      SELECT
        r.id AS "registry_id",
        NULL::text AS "domain_id",
        NULL::numeric(78,0) AS "masked_token_id",
        NULL::numeric(78,0) AS "token_id",
        NULL::text AS "label",
        0 AS depth
        -- ARRAY[]::numeric[] AS traversed_path
      FROM
        ${schema.v2_registry} r
      WHERE
        r.id = ${ROOT_REGISTRY}

      UNION ALL

      -- Recursive case: Find matching domain
      SELECT
        d."subregistry_id" AS "registry_id",
        d.id AS "domain_id",
        d."masked_token_id",
        d."token_id",
        d.label,
        pt.depth + 1 AS depth
        -- pt.traversed_path || d."masked_token_id":  :numeric AS traversed_path
      FROM
        path_traversal pt
      JOIN
        ${schema.v2_domain} d ON d."registry_id" = pt."registry_id"
      WHERE
        d."masked_token_id" = (${rawTokenIdsArray})[pt.depth + 1]
        AND pt.depth < array_length(${rawTokenIdsArray}, 1)
    )

    SELECT * FROM path_traversal
    WHERE domain_id IS NOT NULL -- only return domains, not root registry
    ORDER BY depth
  `);

  // TODO: idk type this correctly
  const rows = result.rows as {
    registry_id: CAIP10AccountId;
    domain_id: string;
    masked_token_id: string;
    token_id: string;
    label: string;
    depth: number;
  }[];

  // the domain in question was found iff the path has exactly the correct number of nodes
  const exists = rows.length > 0 && rows.length === tokenIds.length;
  if (!exists) throw new HTTPException(404, { message: "Domain not found." });

  const lastRow = rows[rows.length - 1]!; // NOTE: must exist given length check above
  if (lastRow.domain_id === null) throw new Error(`Expected domain_id`);

  // the last element is the node and it exists in the tree
  return {
    path: rows,
    domain: await db.query.v2_domain.findFirst({
      where: (t, { eq }) => eq(t.id, lastRow.domain_id),
    }),
  };
}
