---
title: Terminology
---

New terminology (beyond the [official ENS glossary](https://docs.ens.domains/terminology)) has been needed in the course of building the ENS Multichain Indexer. The following should be understood as a draft that is open to community feedback. Each definition below aims to maximize alignment with the official ENS glossary where possible.

# Subregistry

Any data structure outside of the [Registry](https://docs.ens.domains/terminology#registry) that manages supplemental state for a set of [subnames](https://docs.ens.domains/terminology#subname-subdomain). Each [name](https://docs.ens.domains/terminology#name) is associated with at least 1 subregistry (through the [Name Wrapper](https://docs.ens.domains/terminology#name-wrapper)) and may optionally be associated with multiple subregistries. When a name is associated with multiple subregistries, this means that the full state of a name must be combined across the Registry and each associated subregistry. For example, the state of all direct subnames of .eth is distributed across the Registry and two subregistries: the BaseRegistrar and the Name Wrapper. The ENS protocol does not currently define standards for subregistries. Subregistries currently exist outside the scope of the ENS protocol. For example, subregistries could live on L1, on L2s, or offchain (in a database or even in a Google Sheet). The ENS protocol currently provides no standardized mechanism to discover subregistries or to interact with subregistries.

Some specific implementations of subregistries include:

* The [BaseRegistrar](https://github.com/ensdomains/ens-contracts/blob/staging/contracts/ethregistrar/BaseRegistrarImplementation.sol) that holds supplemental state for direct subnames of .eth. This includes state for ERC721 NFTs and expiry times.
* The [NameWrapper](https://docs.ens.domains/terminology#name-wrapper), which serves as a subregistry for the entire ENS root (all ENS names).  This includes state for ERC1155 NFTs, expiry times, and fuses.
  * Note how direct subnames of .eth are an example of multiple subregistries potentially holding supplemental state for a name outside the Registry.
* The contracts on Base that manage supplemental state for direct subnames of [base.eth](https://www.base.org/names).
* The contracts on Linea that manage supplemental state for direct subnames of [linea.eth](https://names.linea.build/).
* The contracts on Base / Optimism that manage supplemental state for DNS names managed by [3DNS](https://3dns.box/).
* The offchain databases that manage supplemental state for direct subnames of [uni.eth](https://blog.uniswap.org/introducing-uni-eth-your-unique-web3-username).
* The offchain databases that manage supplemental state for direct subnames of [cb.id](https://help.coinbase.com/en/wallet/managing-account/coinbase-ens-support).
* DNS nameservers for (essentially) all DNS names. Since ENS is a superset of DNS, (essentially) any DNS name is an ENS name. Therefore, whenever supplemental state associated with a DNS name is updated in a DNS nameserver, a subregistry is being updated.

# Subregistrar

Any system that is a [Registrar](https://docs.ens.domains/terminology#registrar) or that writes to a subregistry.

This definition expands the definition of Registrar to include cases such as:

* The [ETHRegistrarController](https://github.com/ensdomains/ens-contracts/blob/staging/contracts/ethregistrar/ETHRegistrarController.sol) that writes to BaseRegistrar (the owner of the "eth" TLD). Note how the definition of "Registrar" in the official ENS glossary only includes contracts that are pointed to by the owner field of the Registry. Therefore, the BaseRegistrar is a Registrar (and a Subregistry), while the ETHRegistrarController is a Subregistrar.
* The contracts on Base that write to the Subregistry for direct subnames of base.eth. These contracts live on Base, therefore they cannot meet the definition of Registrar because they can't be set as the owner in the Registry on Ethereum mainnet.
* The offchain systems that write to the offchain databases associated with direct subnames of uni.eth and cb.id.
* Any NFT marketplace that supports the exchange of an NFT representing ownership of an ENS name. Each time a NFT is exchanged, state about that NFT must be updated within a related subregistry. Therefore the marketplace enabling that trade is a Subregistrar.
* Any DNS registrar, as ENS is a superset of DNS.

# Shadow Registry

A Subregistry meeting ALL of the following constraints:
1. Not the Registry;
2. Implemented as a smart contract exposing the same interface as the Registry;
3. Used as part of the source of truth for a CCIP-Read Gateway Server for ENSIP-10 (wildcard resolution) powered subnames.

A specific implementation of a Shadow Registry can be found in [this contract](https://github.com/base-org/basenames/blob/v1.0.4/src/L2/Registry.sol) storing a subset of the state of base.eth subnames on Base.
