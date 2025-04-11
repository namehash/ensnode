changesets doesn't allow jsonc so here are the docs for the changeset config

ensindexer, ensadmin, and ensrainbow MUST be fixed, so that they always have an identical version number, necessary for our current deploy script (which requires that they all use the same tag)

we need the `privatePackages` config so that changesets will version/tag our private apps/packages
we ignore docs on top of that to avoid versioning docs
we disable prettier
