# Indexer plugins

This directory contains plugins that define subname-specific processing of blockchain events.
One or more plugins are activated at a time. Use the `ACTIVE_PLUGINS` env variable to select the active plugins, for example:

```
ACTIVE_PLUGINS=subgraph,basenames,lineanames
```
