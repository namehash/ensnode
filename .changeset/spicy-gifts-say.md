---
"ensadmin": patch
---

Add input validation and normalization to the Explore Names form and name detail page. The form normalizes valid inputs (e.g. "VITALIK.ETH" → "vitalik.eth") before navigating, and shows inline errors for invalid or unsupported names. Direct URL visits with unnormalized but normalizable names are redirected to the normalized form. Empty name params show the form instead of a broken detail page. Breadcrumb links now use next/link for client-side navigation.
