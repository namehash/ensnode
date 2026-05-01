# `@ensnode/ens-test-kit`

Declarative ENS testing primitives and fixtures for ENSNode.

This package currently ships the initial type contracts and module layout for:

- API interfaces (`ResolutionsApi`, `DomainsApi`, `AccountsApi`, `ResolversApi`)
- Shared testing types (`Domain`, `Account`, `Resolver`, `Registration`, and related aliases)
- Case types (`TestCase<Api>`)
- Seeder fixture type contracts
- Vitest and CLI type entrypoints

Runtime seeding and test-runner behavior will be added in follow-up steps.
