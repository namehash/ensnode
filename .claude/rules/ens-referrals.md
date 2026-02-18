---
paths:
  - "packages/ens-referrals/**"
  - "apps/ensapi/src/handlers/ensanalytics*"
  - "apps/ensapi/src/lib/ensanalytics/**"
  - "apps/ensapi/src/cache/referr*"
  - "apps/ensapi/src/cache/referral*"
  - "apps/ensapi/src/middleware/referr*"
  - "apps/ensapi/src/middleware/referral*"
---

# ENS Referrals Rules

Applies when working in `packages/ens-referrals/` or ENSApi referral/analytics code.

## `@namehash/ens-referrals` Package

**Purpose**: Utilities for ENS referral program functionality.

**Key Features**:
- Referrer metrics calculation
- Leaderboard generation
- Award pool share computation
- Multi-edition referral campaign support (v1)

## v0 vs v1 — CRITICAL STABILITY RULES

| | v0 | v1 |
|--|--|--|
| Import | `from "@namehash/ens-referrals"` | `from "@namehash/ens-referrals/v1"` |
| Model | Single campaign, global rules | Multiple editions (campaigns), per-edition rules |
| Status | **Production** (ENSAwards uses it) | Under active development, no production users |
| API endpoints | `/ensanalytics/*` | `/v1/ensanalytics/*` |
| **Stability** | **Must remain backward compatible — do not break** | Breaking changes acceptable |

**v0 rule**: Only make changes to v0 if absolutely necessary or prohibitively costly to avoid. ENSAwards is a production user — breakage has real consequences.

**v1 rule**: Active development; breaking changes are fine since there are no production users yet. New features should go into v1.

## v0 Domain Types Hierarchy

```
ReferrerMetrics
  └── ScoredReferrerMetrics (+ score calculation)
      └── RankedReferrerMetrics (+ rank, isQualified, finalScore)
          └── AwardedReferrerMetrics (+ awardPoolShare)

UnrankedReferrerMetrics (for addresses not on leaderboard)
```

## Key Differences

- **v0**: Single campaign with global rules and metrics
- **v1**: Multiple "editions" (campaigns) with per-edition rules, metrics, and configurations; introduces edition defaults
