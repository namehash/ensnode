---
"enssdk": minor
---

Switch composite ids to dash-delimited tuples so Ponder's profile-pattern matcher can decompose them and prefetch hot tables.

Every id constructor (`makeENSv1RegistryId`, `makeENSv2RegistryId`, `makeENSv1VirtualRegistryId`, `makeConcreteRegistryId`, `makeResolverId`, `makeENSv1DomainId`, `makeENSv2DomainId`, `makePermissionsId`, `makePermissionsResourceId`, `makePermissionsUserId`, `makeResolverRecordsId`, `makeRegistrationId`, `makeRenewalId`) now joins its components with `-` instead of CAIP-style mixed `:` / `/` delimiters. `makeENSv2DomainId` no longer wraps the registry contract in CAIP-19 ERC1155 form since the registry already namespaces it. Ponder's matcher only does single-level string-delimiter splits, so the unified `-` tuple is the shape it can decompose to derive prefetch lookup keys from event args.
