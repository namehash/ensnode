# 'linea.eth' plugin for Ponder indexer

This plugin contains configuration required to run blockchain indexing with [the Ponder app](https://ponder.sh/). It includes relevant ABI files, contract addresses and the block numbers those contracts were deployed at on a selected network.

## Architecture

The Linea contracts manage subnames of "linea.eth". All contracts and their interactions were described here:
- https://github.com/Consensys/linea-ens/tree/main/packages/linea-ens-contracts#linea-ens-contracts
- https://github.com/Consensys/linea-ens?tab=readme-ov-file#ccipread-process

The Linea contracts are built of top of the ENS contracts with slight alterations to the original logic. It's mainly renaming public methods, while keeping their logic in-tract, and replacing hard-coded `eth` node values into variable node value. The full diff can be found here:
- https://github.com/tk-o/ens-contracts/pull/1/files#diff-4153cf8cef2b203997bac3fed582a1e8d8693abb2665ae8b3846a25a502f2fa0

