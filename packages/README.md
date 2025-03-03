# Releasing Packages

We use [changesets](https://github.com/changesets/changesets) to manage our NPM releases. If you're changing or adding to `packages/*`, you should create a changeset.

1. Run `pnpm changeset`
2. Choose the packages you want to version
3. Add a summary of the changes
4. Commit the changeset file
5. Open a Pull Request
   - This PR should include the changeset file
   - Link to any existing issues that may exist
6. Once a PR is merged, a new or existing `Version Packages` PR will be created, or updated
   - This will also update the `CHANGELOG.md` for each package
7. Merge the `Version Packages` when you're ready to publish a new version (of all packages) to NPM
   - The GitHub Action will publish the packages to NPM automatically
