# ENS Referrals

This package provides utilities for working with ENS Referrals, including useful types and utility functions.

## Installation

```bash
npm install @namehash/ens-referrals viem
```

### Basic Usage

```typescript
import {
  buildEncodedReferrer,
  decodeEncodedReferrer,
  buildEnsReferralUrl
} from "@namehash/ens-referrals";
import type { Address } from 'viem';

const referrerAddress: Address = "0xd8da6bf26964af9d7eed9e03e53415d37aa96045";

// Build an encoded referrer value (according to the subjective referrer encoding used for ENS Holiday Awards)
const encodedReferrer = buildEncodedReferrer(referrerAddress); // 0x000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045

// Decode an encoded referrer value (according to the subjective referrer encoding used for ENS Holiday Awards)
const decodedReferrer = decodeEncodedReferrer(encodedReferrer); // 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045

// Build a referrer URL to the official ENS manager app
const referrerUrl = buildEnsReferralUrl(referrerAddress).toString(); // https://app.ens.domains/?referrer=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
```
