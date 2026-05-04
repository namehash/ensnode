---
"ensapi": minor
---

Omnigraph **`Query.labels`** improvements: add a **`LabelHash`** GraphQL scalar (`0x` + 64 lowercase hex, parsed via `parseLabelHash`), rename the input to **`LabelsByLabelHashesInput`** with field **`labelHashes`**, enforce stricter parsing/validation through the scalar layer, normalize mixed-case hex at parse time, cap batch size to **`100`** LabelHashes per request for a round-number limit, and keep development error masking aligned with Yoga defaults while ensuring intentional `GraphQLError`s still surface useful client messages where applicable.
