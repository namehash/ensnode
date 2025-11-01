# `registrars` plugin for ENSIndexer

This plugin enables tracking all registrations and renewals that ever happened for subregistries managing the following:
- direct subnames of the Ethnames registrar managed name (ex: `eth` for all namespaces).
- direct subnames of the Basenames registrar managed name (ex: for mainnet `base.eth` but varies for other namespaces).
- direct subnames of the Lineanames registrar managed name (ex: for mainnet `linea.eth` but varies for other namespaces).

Additionally indexes:
- All Registrar Controllers ever associated with a known Registrar contract.
- All ENS Referrals (for Registrar Controllers supporting ENS Referral Programs).
