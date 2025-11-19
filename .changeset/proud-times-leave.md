---
"@ensnode/ensapi": minor
"@ensnode/ensnode-sdk": minor
---

Add configurable ENS Holiday Awards date range environment variables (`ENS_HOLIDAY_AWARDS_START` and `ENS_HOLIDAY_AWARDS_END`) to ENSApi. If not set, defaults to hardcoded values from `@namehash/ens-referrals` package. Includes validation to ensure end date is after or equal to start date. Dates must be specified in ISO 8601 format (e.g., '2025-12-01T00:00:00Z').
