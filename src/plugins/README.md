# Indexer plugins

This directory contains plugins which define subname-specific processing of blockchain events.
One or more plugins are activated at a time. Use the `ACTIVE_PLUGINS` env variable to select the active plugins, for example:

```
ACTIVE_PLUGINS=eth,base.eth,linea.eth
```