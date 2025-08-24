---
"ensrainbow": minor
"@docs/ensnode": minor
---

Introduced ENSRainbow v2 data format.

This change addresses large Docker image sizes and data management challenges.

Key changes:
- A new .ensrainbow data format replaces SQL dumps, supporting label set IDs and versioned label sets for incremental data updates.
- ENSRainbow is now distributed as a lightweight, data-less Docker image.
- On first startup, the application downloads a pre-ingested database from R2, significantly reducing setup time.
- This new architecture allows for deterministic data healing and easier data evolution.
