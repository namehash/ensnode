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
- The root [`@namehash/ens-referrals`](https://github.com/namehash/ensnode/tree/main/packages/ens-referrals/src/client.ts) import is deprecated and is planned to be removed soon.

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

### Get a referrer leaderboard page &rarr; `getReferrerLeaderboardPage()`

Returns a paginated leaderboard for a specific referral program edition.

```typescript
const editionSlug = "2025-12";

const response = await client.getReferrerLeaderboardPage({
  edition: editionSlug,
});

if (response.responseCode === ReferrerLeaderboardPageResponseCodes.Ok) {
  const leaderboardPage = response.data;

  if (leaderboardPage.awardModel === ReferralProgramAwardModels.Unrecognized) {
    // gracefully handle forwards-compatibility as new award models are added in the future
    console.log(`Unrecognized award model: ${leaderboardPage.originalAwardModel} - skipping`);
  } else {
    console.log(`Edition: ${editionSlug}`);
    console.log(`Subregistry: ${leaderboardPage.rules.subregistryId}`);
    console.log(`Total Referrers: ${leaderboardPage.pageContext.totalRecords}`);
    console.log(
      `Page ${leaderboardPage.pageContext.page} of ${leaderboardPage.pageContext.totalPages}`,
    );

    const noReferrersFallback = "No referrers in this edition";
    const firstReferrer = leaderboardPage.referrers[0] ?? null;

    if (leaderboardPage.awardModel === ReferralProgramAwardModels.PieSplit) {
      console.log(`Max Qualified Referrers: ${leaderboardPage.rules.maxQualifiedReferrers}`);
      console.log(
        `First Referrer's Final Score Boost: ${firstReferrer !== null ? firstReferrer.finalScoreBoost : noReferrersFallback}`,
      );
      console.log(
        `First Referrer's Award Pool Share: ${firstReferrer !== null ? firstReferrer.awardPoolShare : noReferrersFallback}`,
      );
    }

    if (leaderboardPage.awardModel === ReferralProgramAwardModels.RevShareCap) {
      console.log(
        `Min Base Revenue Contribution: ${leaderboardPage.rules.minBaseRevenueContribution}`,
      );
      console.log(`Max Base Revenue Share: ${leaderboardPage.rules.maxBaseRevenueShare}`);
      console.log(
        `Tentative award for the top ranked referrer: ${firstReferrer !== null ? firstReferrer.cappedAward : noReferrersFallback}`,
      );
    }
  }
}
```

More examples are available in [`packages/ens-referrals/src/v1/client.ts`](https://github.com/namehash/ensnode/tree/main/packages/ens-referrals/src/v1/client.ts).

### Get a referrer's metrics across editions &rarr; `getReferrerMetricsEditions()`

Returns referrer metrics for a specified referrer across one or more editions.

```typescript
const response = await client.getReferrerMetricsEditions({
  referrer: "0x1234567890123456789012345678901234567890",
  editions: ["2025-12", "2026-04"],
});

if (response.responseCode === ReferrerMetricsEditionsResponseCodes.Ok) {
  for (const [editionSlug, detail] of Object.entries(response.data)) {
    console.log(`Edition: ${editionSlug}`);

    if (detail.awardModel === ReferralProgramAwardModels.Unrecognized) {
      // gracefully handle forwards-compatibility as new award models are added in the future
      console.log(`Unrecognized award model: ${detail.originalAwardModel} - skipping`);
      continue;
    }

    console.log(`Type: ${detail.type}`);

    if (detail.type === ReferrerEditionMetricsTypeIds.Ranked) {
      console.log(`Rank: ${detail.referrer.rank}`);
    }

    if (detail.awardModel === ReferralProgramAwardModels.PieSplit) {
      console.log(`Referrer's Final Score: ${detail.referrer.finalScore}`);
      console.log(`Referrer's Award Pool Share: ${detail.referrer.awardPoolShare * 100}%`);
    }

    if (detail.awardModel === ReferralProgramAwardModels.RevShareCap) {
      console.log(
        `Referrer's total base revenue contribution: ${detail.referrer.totalBaseRevenueContribution}`,
      );
      console.log(`Referrer's uncapped award value: ${detail.referrer.uncappedAward}`);
    }
  }
}
```

More examples are available in [`packages/ens-referrals/src/v1/client.ts`](https://github.com/namehash/ensnode/tree/main/packages/ens-referrals/src/v1/client.ts).

## See how current Referral Program Editions are configured

Check out [`production-editions.json`](https://ensawards.org/production-editions.json) — the live config file powering our production deployment.


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
