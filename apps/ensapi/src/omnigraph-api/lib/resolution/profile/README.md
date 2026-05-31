# Domain profile resolution

Interpreted ENS profile fields exposed on `Domain.profile` (and `PrimaryNameRecord.profile`) in the Omnigraph API. Raw resolver records are resolved in one round-trip; each GraphQL field is backed by a `ProfileFieldParser` that declares its record selection and parsing logic.

## Architecture

```
profile/
  build-profile-selection.ts   # GraphQL selection → ResolverRecordsSelection
  parsers/
    types.ts                   # ProfileFieldParser<T>
    texts.ts                   # Simple text passthrough parsers
    images.ts                  # avatar / header → httpUrl (direct HTTP + metadata service)
    social.ts                  # Service keys → { handle, httpUrl }
    addresses.ts               # Multicoin addresses → typed address strings
  README.md
```

GraphQL wiring lives in `apps/ensapi/src/omnigraph-api/schema/profile.ts`.

Each parser is a singleton with:

- `selection` — which text keys / coin types must be fetched
- `parse(records)` — derive the GraphQL output from `ResolvedRecordsModel`

`buildProfileSelectionFromResolveContainerInfo` merges parser selections based on the client's `profile { ... }` sub-selection.

## Records roadmap

Record names use a `texts.<key>` prefix for ENS text records and `addresses.<coin>` for multicoin address records. GraphQL output paths are noted in the description where they differ from the on-chain key.

| Record name                                       | Status | ENSIP                                                                            | Description                                                                                                                                                                           |
| ------------------------------------------------- | ------ | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `texts.description`                               | ✅     | [18](https://docs.ens.domains/ensip/18), [5](https://docs.ens.domains/ensip/5)   | Biography text. GraphQL: `profile.description`. Parser: `ProfileDescriptionParser`.                                                                                                   |
| `texts.avatar`                                    | ✅     | [18](https://docs.ens.domains/ensip/18), [12](https://docs.ens.domains/ensip/12) | Avatar image ([ENSIP-12](https://docs.ens.domains/ensip/12)). GraphQL: `profile.avatar.httpUrl`. Direct `http(s)://` or ENS Metadata Service fallback. Parser: `ProfileAvatarParser`. |
| `texts.header`                                    | ✅     | [18](https://docs.ens.domains/ensip/18), [12](https://docs.ens.domains/ensip/12) | Header / banner image ([ENSIP-12](https://docs.ens.domains/ensip/12)). GraphQL: `profile.header.httpUrl`. Parser: `ProfileHeaderParser`.                                              |
| `texts.url`                                       | ✅     | [18](https://docs.ens.domains/ensip/18), [5](https://docs.ens.domains/ensip/5)   | Website URL. GraphQL: `profile.website.httpUrl`. Parser: `ProfileWebsiteParser`.                                                                                                      |
| `texts.com.github`                                | ✅     | [18](https://docs.ens.domains/ensip/18), [5](https://docs.ens.domains/ensip/5)   | GitHub username or repo URL. GraphQL: `profile.socials.github`. Parser: `SocialGithubParser`.                                                                                         |
| `texts.com.twitter`                               | ✅     | [18](https://docs.ens.domains/ensip/18), [5](https://docs.ens.domains/ensip/5)   | Twitter / X handle or URL. GraphQL: `profile.socials.twitter`. Parser: `SocialTwitterParser`.                                                                                         |
| `texts.org.telegram`                              | ✅     | [18](https://docs.ens.domains/ensip/18), [5](https://docs.ens.domains/ensip/5)   | Telegram handle or URL. GraphQL: `profile.socials.telegram`. Parser: `SocialTelegramParser`.                                                                                          |
| `addresses.ethereum`                              | ✅     | [9](https://docs.ens.domains/ensip/9)                                            | Ethereum address (`coinType` 60). GraphQL: `profile.addresses.ethereum`. Parser: `ProfileAddressEthereumParser`.                                                                      |
| `addresses.base`                                  | ✅     | [11](https://docs.ens.domains/ensip/11)                                          | Base address (`coinType` 2147492101). GraphQL: `profile.addresses.base`. Parser: `ProfileAddressBaseParser`.                                                                          |
| `addresses.bitcoin`                               | ✅     | [9](https://docs.ens.domains/ensip/9)                                            | Bitcoin address (`coinType` 0). GraphQL: `profile.addresses.bitcoin`. Parser: `ProfileAddressBitcoinParser`.                                                                          |
| `addresses.solana`                                | ✅     | [9](https://docs.ens.domains/ensip/9)                                            | Solana address (`coinType` 501). GraphQL: `profile.addresses.solana`. Parser: `ProfileAddressSolanaParser`.                                                                           |
| `texts.theme`                                     | 📋     | [18](https://docs.ens.domains/ensip/18)                                          | Comma-separated hex colour scheme (`background,text,accent,accentText,border`).                                                                                                       |
| `texts.email`                                     | 📋     | [18](https://docs.ens.domains/ensip/18), [5](https://docs.ens.domains/ensip/5)   | Contact email address.                                                                                                                                                                |
| `texts.location`                                  | 📋     | [18](https://docs.ens.domains/ensip/18), [5](https://docs.ens.domains/ensip/5)   | Human-readable location (e.g. `Melbourne, Australia`).                                                                                                                                |
| `texts.timezone`                                  | 📋     | [18](https://docs.ens.domains/ensip/18)                                          | tz database timezone (e.g. `Australia/Melbourne`).                                                                                                                                    |
| `texts.language`                                  | 📋     | [18](https://docs.ens.domains/ensip/18)                                          | ISO 639-1 two-letter language code.                                                                                                                                                   |
| `texts.primary-contact`                           | 📋     | [18](https://docs.ens.domains/ensip/18)                                          | Record key of the primary contact (e.g. `com.github`, `email`).                                                                                                                       |
| `texts.keywords`                                  | 📋     | [5](https://docs.ens.domains/ensip/5)                                            | Comma-separated keywords, most significant first.                                                                                                                                     |
| `texts.mail`                                      | 📋     | [5](https://docs.ens.domains/ensip/5)                                            | Physical mailing address.                                                                                                                                                             |
| `texts.notice`                                    | 📋     | [5](https://docs.ens.domains/ensip/5)                                            | Notice regarding the name.                                                                                                                                                            |
| `texts.phone`                                     | 📋     | [5](https://docs.ens.domains/ensip/5)                                            | Phone number as E.164 string.                                                                                                                                                         |
| `texts.com.linkedin`                              | 📋     | [5](https://docs.ens.domains/ensip/5)                                            | LinkedIn username.                                                                                                                                                                    |
| `texts.com.peepeth`                               | 📋     | [5](https://docs.ens.domains/ensip/5)                                            | Peepeth username.                                                                                                                                                                     |
| `texts.io.keybase`                                | 📋     | [5](https://docs.ens.domains/ensip/5)                                            | Keybase username.                                                                                                                                                                     |
| `texts.vnd.github`                                | 📋     | [5](https://docs.ens.domains/ensip/5)                                            | Legacy GitHub key (renamed to `com.github`). Planned as fallback when `com.github` is unset.                                                                                          |
| `texts.vnd.twitter`                               | 📋     | [5](https://docs.ens.domains/ensip/5)                                            | Legacy Twitter key (renamed to `com.twitter`). Planned as fallback when `com.twitter` is unset.                                                                                       |
| `texts.vnd.peepeth`                               | 📋     | [5](https://docs.ens.domains/ensip/5)                                            | Legacy Peepeth key (renamed to `com.peepeth`). Planned as fallback when `com.peepeth` is unset.                                                                                       |
| `contenthash`                                     | 📋     | [7](https://docs.ens.domains/ensip/7)                                            | IPFS / Swarm content address. Resolved on `records.contenthash` today; not yet exposed on `profile`.                                                                                  |
| `texts.agent-registration[<registry>][<agentId>]` | 📋     | [25](https://docs.ens.domains/ensip/25)                                          | Non-empty attestation linking an ENS name to an on-chain AI agent registry entry.                                                                                                     |
| `texts.agent-context`                             | 📋     | [26](https://docs.ens.domains/ensip/26)                                          | Agent description and discovery entry point (plain text, Markdown, YAML, JSON, …).                                                                                                    |
| `texts.agent-endpoint[mcp]`                       | 📋     | [26](https://docs.ens.domains/ensip/26)                                          | Model Context Protocol endpoint URL.                                                                                                                                                  |
| `texts.agent-endpoint[a2a]`                       | 📋     | [26](https://docs.ens.domains/ensip/26)                                          | Agent-to-Agent protocol endpoint URL.                                                                                                                                                 |
| `texts.agent-endpoint[web]`                       | 📋     | [26](https://docs.ens.domains/ensip/26)                                          | Human-facing web interface URL.                                                                                                                                                       |
| `texts.alias`                                     | ➖     | [18](https://docs.ens.domains/ensip/18)                                          | Display alias. Not planned — ENSv2 will define aliases differently.                                                                                                                   |
| `texts.name`                                      | ➖     | [18](https://docs.ens.domains/ensip/18)                                          | Legacy alias key superseded by `alias`. Not planned — ENSv2 will define aliases differently.                                                                                          |
| `texts.display`                                   | ➖     | [5](https://docs.ens.domains/ensip/5)                                            | Canonical display name. Not planned.                                                                                                                                                  |
| `addresses.*` (other coin types)                  | ➖     | [9](https://docs.ens.domains/ensip/9), [11](https://docs.ens.domains/ensip/11)   | Additional multicoin addresses beyond ETH, Base, BTC, SOL. Not planned.                                                                                                               |

**Status legend:** ✅ done · 📋 planned · ➖ not planned

Per [ENSIP-18](https://docs.ens.domains/ensip/18), profile service values should omit optional formatting (`@`, `/u/`, …) where possible; parsers should tolerate bare handles and full URLs.

## Adding a new profile field

1. Implement a `ProfileFieldParser` in the appropriate `parsers/*.ts` module (or add a new module).
2. Export it from `parsers/index.ts`.
3. Register selection merging in `build-profile-selection.ts`.
4. Wire the GraphQL field in `schema/profile.ts`.
5. Add table-driven tests (`it.each` OK + ERR rows) — see `.memory-bank/skills/table-driven-unit-tests/SKILL.md`.
