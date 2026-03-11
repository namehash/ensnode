/**
 * The columns that define the stable sort order for events, mirroring the composite index on the
 * events table:
 *   [timestamp, chainId, blockNumber, transactionIndex, logIndex, id]
 *
 * Event integration tests are co-located with their parent types:
 * - Domain.events → domain.integration.test.ts
 * - Account.events → account.integration.test.ts
 * - Permissions.events → permissions.integration.test.ts
 */
export {};
