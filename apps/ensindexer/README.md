# ENSIndexer

ENSIndexer is the main component in the ENSNode project. It is responsible for indexing all data about the ENS project.

The indexer is built with [Ponder](https://ponder.sh) and is comprised of plugins which index data from different chains and/or parties. For example, there are plugins for base, linea and 3dns. The indexer is built to be extensible with the plugin system so as the ENS ecosystem expands and new projects join, it can be adapted to support them.

The goal of the ENSIndexer project is to provide data for anyone wanting to access it without having to write custom logic or even understand the intimate intricacies of the ENS protocol and 3rd party services. In particular, this is useful for developers integrating ENS into their project who can use the hosted API or choose to self-host the indexer if they wish.

## Documentation

For detailed documentation and guides see the [ENSNode Indexer Documentation](https://ensnode.io/ensindexer/) and more generally the [ENSNode Documentation](https://ensnode.io/docs).

## License

Licensed under the MIT License, Copyright © 2025-present [NameHash Labs](https://namehashlabs.org).

See [LICENSE](./LICENSE) for more information.
