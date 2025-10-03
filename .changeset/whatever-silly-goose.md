---
"ensindexer": minor
---

Introduces the new `protocol-acceleration` plugin to replace the `reverse-resolvers` plugin with enhanced Protocol Acceleration capabilities. It can be run in isolation to speed up the performance of ENSNode's Resolution API.

**Migration Required**

If you're using the `reverse-resolvers` plugin, you need to update your configuration:

1. Replace `reverse-resolvers` with `protocol-acceleration` in your `PLUGINS` environment variable
2. This is a breaking change that requires re-indexing from scratch due to database schema changes

Example:
```bash
# Before (example)
PLUGINS=subgraph,basenames,lineanames,threedns,reverse-resolvers,referrals

# After (example)
PLUGINS=subgraph,basenames,lineanames,threedns,protocol-acceleration,referrals
```
