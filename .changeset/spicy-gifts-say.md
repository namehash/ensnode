---
"ensadmin": patch
---

Add input validation and normalization to the Explore Names form and name detail page. The form uses `interpretNameFromUserInput` to normalize valid inputs before navigating, and shows inline errors for invalid or unsupported names. The detail page validates query params with `isNormalizedName`/`isInterpretedName` and shows appropriate error states. Empty name params show the form instead of a broken detail page. Breadcrumb links now use next/link for client-side navigation.
