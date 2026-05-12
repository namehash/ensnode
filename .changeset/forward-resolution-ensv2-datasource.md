---
"ensapi": patch
---

Forward Resolution now gates the ENSv2 bailout on the presence of an `ENSv2Root` datasource in the active namespace rather than on whether the ENSv2 plugin is configured. A namespace may be ENSv1-only even when the ENSv2 plugin is defined, and in that case forward resolution must continue down the ENSv1 path.
