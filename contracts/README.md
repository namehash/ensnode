# ENSNode Contracts

Solidity smart contracts created as an explicit part of the ENSNode platform. Each contract lives in its own subdirectory as a standalone [Foundry](https://book.getfoundry.sh/) project.

Note that this is not a directory of all ENS contracts. For general directories of ENS contracts see:

1. The [datasources package in the ENSNode monorepo](https://github.com/namehash/ensnode/tree/main/packages/datasources).
2. The [ens-contracts repo](https://github.com/ensdomains/ens-contracts).
3. The [contracts-v2 repo](https://github.com/ensdomains/contracts-v2).

## Contracts

| Directory          | Contract        | Purpose                                                                                             |
| ------------------ | --------------- | --------------------------------------------------------------------------------------------------- |
| `ens-name-healer/` | `ENSNameHealer` | Enable healed labels in ENS names to automatically propagate to all decentralized ENSNode instances |
