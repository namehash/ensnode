import type { Context } from "ponder:registry";

import type { DomainId, LabelHash } from "@ensnode/ensnode-sdk";

// for claude: context.db.sql is the Drizzle object
// https://ponder.sh/docs/indexing/write#query-builder
// https://orm.drizzle.team/docs/rqb

export async function reconcileRegistryAddition(context: Context, registryId: string) {
  // 0. if this registry does not terminate at root, no-op
  // 1. for each registry.domains, reconcileDomainAddition in transaction
  // TODO: perhaps reconcileDomainAddition can be implemented as batch
}

export async function reconcileRegistryRemoval(context: Context, registryId: string) {
  // 0. if this registry does not terminate at root, no-op
  // 1. for each registry.domains, reconcileDomainRemoval in transaction
  // TODO: perhaps reconcileDomainRemoval can be implemented as batch
}

export async function reconcileDomainAddition(context: Context, id: DomainId) {
  // 0. if this domain does not terminate at root, no-op
  // 1. fetch set of all Domains that have this domain as a parent (include this domain)
  //   - include: recursive path to root
  // 2. for each of these Domains, compute node/fqdn using path
  // 3. bulk insert into namespace
}

export async function reconcileDomainRemoval(context: Context, id: DomainId) {
  // 0. if this domain is not in namespace, no-op
  // 1. identify this domain + all recursive children (via strict suffix match)
  // 2. bulk remove from namespace
}

export async function reconcileLabelChange(context: Context, labelHash: LabelHash) {
  // 1. identify all Domains in the namespace that use this label + all recursive children (via strict suffix match)
  //   - include: recursive path to root
  // 2. for each, compute new fqdn using path
  // 3. bulk update
}
