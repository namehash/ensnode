---
"@namehash/ens-referrals": minor
---

Generalize disqualifications into admin actions: introduce AdminAction discriminated union (Disqualification | Warning), rename `disqualifications` to `adminActions` in rev-share-cap rules, and replace `adminDisqualificationReason` with `adminAction` in referrer metrics.
