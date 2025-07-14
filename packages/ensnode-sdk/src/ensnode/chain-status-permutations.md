# Chain Status Permutations

Here's a table presenting available permutations of chains statuses, based on Chain RPC Health and Chain Indexing Status.
Each row describes relevant invariants to apply.

| id | name | firstBlockToIndex | lastIndexedBlock | lastSyncedBlock | latestSafeBlock | Invariants |
|----|------|------------------|------------------|-----------------|----------------|------------|
| 1 | Sync & Indexing Unstarted + Unhealthy RPC | X | null | null | null | |
| 2 | Sync & Indexing Unstarted + Healthy RPC | X | null | null | Y | * Y may have any relation to X |
| 3 | Sync Started, Indexing Unstarted + Unhealthy RPC | X | null | Z | null | * Z >= X |
| 4 | Sync Started, Indexing Unstarted + Healthy RPC | X | null | Z | Y | * X <= Z <= Y |
| 5 | Sync Started, Indexing Started + Unhealthy RPC | X | A | Z | null | * X <= A <= Z |
| 6 | Sync Started, Indexing Started + Healthy RPC | X | A | Z | Y | * X <= A <= Z <= Y |
