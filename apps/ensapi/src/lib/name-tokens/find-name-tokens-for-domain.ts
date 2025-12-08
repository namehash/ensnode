import { eq } from "drizzle-orm/sql";

import * as schema from "@ensnode/ensnode-schema";
import {
  bigIntToNumber,
  deserializeAssetId,
  type NameToken,
  type NFTMintStatus,
  type Node,
  type RegisteredNameTokens,
} from "@ensnode/ensnode-sdk";

import { db } from "@/lib/db";

interface FindRegisteredNameTokensForDomainRecord {
  nameTokens: typeof schema.nameTokens.$inferSelect;
  registrationLifecycles: typeof schema.registrationLifecycles.$inferSelect;
}

/**
 * Internal function which executes a single query to get all data required to
 * build a list of {@link RegisteredNameToken} objects.
 */
async function _findRegisteredNameTokensForDomain(
  domainId: Node,
): Promise<FindRegisteredNameTokensForDomainRecord[]> {
  const query = db
    .select({
      nameTokens: schema.nameTokens,
      registrationLifecycles: schema.registrationLifecycles,
    })
    .from(schema.nameTokens)
    // join Registration Lifecycles associated with Name Tokens
    .innerJoin(
      schema.registrationLifecycles,
      eq(schema.nameTokens.domainId, schema.registrationLifecycles.node),
    )
    .where(eq(schema.nameTokens.domainId, domainId));

  const records = await query;

  return records;
}

/**
 * Internal function to map a record returned
 * from {@link _findRegisteredNameTokensForDomain}
 * into the {@link NameToken} object.
 */
function _recordToNameToken(record: FindRegisteredNameTokensForDomainRecord): NameToken {
  const assetId = deserializeAssetId(record.nameTokens.id);
  return {
    domainAsset: {
      ...assetId,
      domainId: record.nameTokens.domainId,
    },
    owner: record.nameTokens.owner,
    mintStatus: record.nameTokens.mintStatus as NFTMintStatus,
  } satisfies NameToken;
}

/**
 * Internal function to group records returned
 * from {@link _findRegisteredNameTokensForDomain} for the requested domain ID
 * and turn them into {@link RegisteredNameTokens} object.
 *
 * @returns {RegisteredNameTokens} if some tokens associated with
 * domain ID were found. Otherwise returns null.
 */
function _recordsToRegisteredNameTokens(
  domainId: Node,
  records: FindRegisteredNameTokensForDomainRecord[],
): RegisteredNameTokens | null {
  if (records.length === 0) {
    return null;
  }

  // Invariant: all records are associated with domain ID
  if (!records.every((r) => r.nameTokens.domainId === domainId)) {
    throw new Error(`All record must be associated with the '${domainId}' domain ID.`);
  }

  let registeredNameTokens: RegisteredNameTokens | null = null;

  // Group nameTokens records as RegisteredNameTokens by domain ID
  for (const record of records) {
    const token = _recordToNameToken(record);
    const expiresAt = bigIntToNumber(record.registrationLifecycles.expiresAt);

    if (registeredNameTokens !== null) {
      // update existing entry
      registeredNameTokens.tokens.push(token);
    } else {
      // initialize entry
      registeredNameTokens = {
        domainId,
        expiresAt,
        tokens: [token],
      } satisfies RegisteredNameTokens;
    }
  }

  // Invariant: registeredNameTokens must exist when there is at least one
  // nameTokens record associated with domain ID
  if (!registeredNameTokens) {
    throw new Error(
      `'registeredNameTokens' must exist when there is at least one 'nameTokens' record associated with domain ID.`,
    );
  }

  return registeredNameTokens;
}

/**
 * Find all Name Tokens for the registered domain by domain ID.
 *
 * @returns {RegisteredNameTokens} if some tokens associated with
 * domain ID were found. Otherwise returns null.
 *
 * Note: if no tokens were found, it means that the subregistry managing
 * the name associated with the domainId is not an actively indexed subregistry.
 */
export async function findRegisteredNameTokensForDomain(
  domainId: Node,
): Promise<RegisteredNameTokens | null> {
  const records = await _findRegisteredNameTokensForDomain(domainId);

  return _recordsToRegisteredNameTokens(domainId, records);
}
