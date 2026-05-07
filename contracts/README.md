# ENSNode Contracts

Solidity smart contracts used in the ENSNode ecosystem. Each contract lives in its own subdirectory as a standalone [Foundry](https://book.getfoundry.sh/) project.

## Contracts

| Directory | Contract | Purpose |
|---|---|---|
| `ens-label-healer/` | `ENSLabelHealer` | Permissioned on-chain label emitter for unresolved ENS labels |

## Prerequisites

Install Foundry: https://book.getfoundry.sh/getting-started/installation

## Usage

Each contract directory is a self-contained Foundry project:

```bash
cd ens-label-healer

# Build
forge build

# Test (includes unit, fuzz, invariant)
forge test -vvv

# Coverage
forge coverage

# Gas snapshot
forge snapshot
```
