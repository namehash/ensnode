---
"@ensnode/ensnode-sdk": patch
"ensindexer": patch
---

The EIP-165 `supportsInterface` probe (used to classify a Resolver's ENSIP-10 `extended` support at index time) now opts out of Ponder's empty-response retry. A `0x` ("returned no data") response from a pre-EIP-165 Resolver is a definitive "not supported", never transient — but Ponder's `context.client` previously retried it 9× with exponential backoff (~64s each), making a full index pathologically slow. The probe now fails fast (still resolving to `extended = false`).
