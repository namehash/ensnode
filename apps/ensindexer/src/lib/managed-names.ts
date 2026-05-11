import config from "@/config";

import type { AccountId } from "enssdk";

import {
  getManagedName as _getManagedName,
  isNameWrapper as _isNameWrapper,
} from "@ensnode/ensnode-sdk";

/**
 * Thin wrappers around the SDK's namespace-parameterized helpers. The indexer always operates
 * inside `config.namespace`, so we partially apply it here to keep call sites terse.
 *
 * @see {@link _getManagedName} for the full docstring on Managed Names.
 */

export const getManagedName = (contract: AccountId) => _getManagedName(config.namespace, contract);

export const isNameWrapper = (contract: AccountId) => _isNameWrapper(config.namespace, contract);
