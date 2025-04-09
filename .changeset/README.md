changesets doesn't allow jsonc so here are the docs for the changeset config

ensindexer and ensadmin are _fixed_ to always match version number and release together
ensrainbow and ensrainbow-sdk are _fixed_ to always match version number and release together

we need the `privatePackages` config so that changesets will version/tag our private apps packages
we ignore docs on top of that to avoid versioning docs
