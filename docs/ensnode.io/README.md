# ENSNode Documentation

[ensnode.io](https://ensnode.io) (the ENSNode docs site) runs on [Astro](https://astro.build/) and [Starlight](https://starlight.astro.build).

## Local Development

### Getting Started

It's easy to get started contributing to the ENSNode documentation:

1. `git clone https://github.com/namehash/ensnode.git`
2. `cd docs/ensnode.io`
3. `pnpm i`
4. `pnpm dev`
5. Open [http://localhost:4321](http://localhost:4321) in your browser

### Optional Steps

The documentation uses a `GITHUB_TOKEN` environment variable to authenticate with GitHub. While this is optional, it is recommended to avoid rate limiting:

1. `cp .env.example .env` (optional)
2. Create a [fine-grained GitHub access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#fine-grained-personal-access-tokens-limitations) and add it to `.env`
3. Stop the Astro server and restart it with `pnpm dev`

Visit [ensnode.io](https://www.ensnode.io) for documentation, guides, and the API reference.
