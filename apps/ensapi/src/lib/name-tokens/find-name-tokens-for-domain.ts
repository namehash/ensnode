import config from "@/config";

import { eq } from "drizzle-orm/sql";

import * as schema from "@ensnode/ensnode-schema";
import {
  type AccountId,
  bigIntToNumber,
  getNameTokenOwnership,
  type InterpretedName,
  type NameToken,
  type NameTokenOwnership,
  type NFTMintStatus,
  type Node,
  parseAssetId,
  type RegisteredNameTokens,
  type UnixTimestamp,
} from "@ensnode/ensnode-sdk";

import { db } from "@/lib/db";

interface FindRegisteredNameTokensForDomainRecord {
  domains: typeof schema.subgraph_domain.$inferSelect;
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
      domains: schema.subgraph_domain,
    })
    .from(schema.nameTokens)
    // join Registration Lifecycles associated with Name Tokens
    .innerJoin(
      schema.registrationLifecycles,
      eq(schema.nameTokens.domainId, schema.registrationLifecycles.node),
    )
    // join Domains associated with Name Tokens
    .innerJoin(schema.subgraph_domain, eq(schema.nameTokens.domainId, schema.subgraph_domain.id))
    .where(eq(schema.nameTokens.domainId, domainId));

  const records = await query;

  return records;
}

/**
 * Internal function to map a record returned
 * from {@link _findRegisteredNameTokensForDomain}
 * into the {@link NameToken} object.
 */
function _recordToNameToken(
  record: FindRegisteredNameTokensForDomainRecord,
  ownership: NameTokenOwnership,
): NameToken {
  const token = parseAssetId(record.nameTokens.id);
  const mintStatus = record.nameTokens.mintStatus as NFTMintStatus;

  return {
    token,
    ownership,
    mintStatus,
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
  accurateAsOf: UnixTimestamp,
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
    const owner = {
      chainId: record.nameTokens.chainId,
      address: record.nameTokens.owner,
    } satisfies AccountId;
    const name = record.domains.name as InterpretedName;
    const ownership = getNameTokenOwnership(config.namespace, name, owner);
    const token = _recordToNameToken(record, ownership);
    const expiresAt = bigIntToNumber(record.registrationLifecycles.expiresAt);

    if (registeredNameTokens !== null) {
      // update existing entry
      registeredNameTokens.tokens.push(token);
    } else {
      // initialize entry
      registeredNameTokens = {
        domainId,
        name,
        tokens: [token],
        expiresAt,
        accurateAsOf,
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
 * Find all Name Tokens for the registered domain by domain ID,
 * accurate as of `accurateAsOf`.
 *
 * @returns {RegisteredNameTokens} if some tokens associated with
 * domain ID were found. Otherwise returns null.
 *
 * Note: if no tokens were found, it means that the subregistry managing
 * the name associated with the domainId is not an actively indexed subregistry.
 */
export async function findRegisteredNameTokensForDomain(
  domainId: Node,
  accurateAsOf: UnixTimestamp,
): Promise<RegisteredNameTokens | null> {
  const records = await _findRegisteredNameTokensForDomain(domainId);

  return _recordsToRegisteredNameTokens(domainId, records, accurateAsOf);
}
