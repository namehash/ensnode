# ENS Referrals

Utilities for working with ENS Referrals data. This package is intended for developers who want to build referral dashboards, stats pages, or other integrations on top of ENS Referrals APIs.

The main entry point today is [`v1`](https://github.com/namehash/ensnode/tree/main/packages/ens-referrals/src/v1), which includes the current client and response types for the latest ENS Referrals program format.

## Installation

```bash
npm install @namehash/ens-referrals viem
```

## Quick Start

`v1` is the recommended version for new integrations.

- [`v1`](https://github.com/namehash/ensnode/tree/main/packages/ens-referrals/src/v1) is the actively supported version that reflects the current ENS Referrals program rules and awards.
- The root [`@namehash/ens-referrals`](https://github.com/namehash/ensnode/tree/main/packages/ens-referrals/src/client.ts) import is kept only for backwards compatibility with the ENS Holiday Awards edition.

### Set up `ENSReferralsClient`

`ENSReferralsClient` is the main way to read referral data from ENSNode.

```typescript
import { ENSReferralsClient } from "@namehash/ens-referrals/v1";

// Create a client with the default ENSNode API URL
const client = new ENSReferralsClient();
```

If you want to use a specific ENSNode deployment, pass its URL to the client:

```typescript
const client = new ENSReferralsClient({
  url: new URL("https://my-ensnode-instance.com"),
});
```

## Use ENS Referrals API (`v1`)

### Get all referral program editions &rarr; `getEditionSummaries()`

Returns the currently configured referral program editions. Editions are sorted by start time, with the newest edition first.

Use these edition slugs when calling the leaderboard and referrer endpoints.

```typescript
const response = await client.getEditionSummaries();

if (response.responseCode === ReferralProgramEditionSummariesResponseCodes.Ok) {
  console.log(`Found ${response.data.editions.length} editions`);

  for (const edition of response.data.editions) {
    console.log(`${edition.slug}: ${edition.displayName}`);
  }
}
```

More examples are available in [`packages/ens-referrals/src/v1/client.ts`](https://github.com/namehash/ensnode/tree/main/packages/ens-referrals/src/v1/client.ts).

### Get the referrer leaderboard page &rarr; `getReferrerLeaderboardPage()`

Returns a paginated leaderboard for a specific referral program edition.

```typescript
const editionSlug = "2025-12";

const response = await client.getReferrerLeaderboardPage({
  edition: editionSlug,
});

if (response.responseCode === ReferrerLeaderboardPageResponseCodes.Ok) {
  const { awardModel, pageContext } = response.data;

  if (awardModel === ReferralProgramAwardModels.Unrecognized) {
    console.log(
      `Unrecognized award model: ${response.data.originalAwardModel} - skipping`,
    );
  } else {
    const { rules } = response.data;

    console.log(`Edition: ${editionSlug}`);
    console.log(`Subregistry: ${rules.subregistryId}`);
    console.log(`Total Referrers: ${pageContext.totalRecords}`);
    console.log(`Page ${pageContext.page} of ${pageContext.totalPages}`);
  }
}
```

More examples are available in [`packages/ens-referrals/src/v1/client.ts`](https://github.com/namehash/ensnode/tree/main/packages/ens-referrals/src/v1/client.ts).

### Get single referrer data &rarr; `getReferrerMetricsEditions()`

Returns referrer metrics for a specified referrer across one or more editions.

```typescript
const response = await client.getReferrerMetricsEditions({
  referrer: "0x1234567890123456789012345678901234567890",
  editions: ["2025-12", "2026-01"],
});

if (response.responseCode === ReferrerMetricsEditionsResponseCodes.Ok) {
  for (const [editionSlug, detail] of Object.entries(response.data)) {
    console.log(`Edition: ${editionSlug}`);

    if (detail.awardModel === ReferralProgramAwardModels.Unrecognized) {
      console.log(
        `Unrecognized award model: ${detail.originalAwardModel} - skipping`,
      );
      continue;
    }

    console.log(`Type: ${detail.type}`);

    if (detail.type === ReferrerEditionMetricsTypeIds.Ranked) {
      console.log(`Rank: ${detail.referrer.rank}`);
      console.log(`Award Share: ${detail.referrer.awardPoolShare * 100}%`);
    }
  }
}
```

More examples are available in [`packages/ens-referrals/src/v1/client.ts`](https://github.com/namehash/ensnode/tree/main/packages/ens-referrals/src/v1/client.ts).

## Other Utilities

The package also includes helpers for building referral links.

```typescript
import { buildEnsReferralUrl } from "@namehash/ens-referrals/v1";
import type { Address } from "viem";

const referrerAddress: Address = "0xd8da6bf26964af9d7eed9e03e53415d37aa96045";

// Build a referrer URL to the official ENS manager app
const referrerUrl = buildEnsReferralUrl(referrerAddress).toString();
// https://app.ens.domains/?referrer=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
```
