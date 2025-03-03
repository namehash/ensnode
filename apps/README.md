# Releasing Apps

We use [changesets](https://github.com/changesets/changesets) to manage our apps releases. If you're changing or adding to `apps/*`, you should create a changeset.

1. Run `pnpm changeset`
2. Choose the apps you want to version
3. Add a summary of the changes
4. Commit the changeset file
5. Open a Pull Request
   - This PR should include the changeset file
   - Link to any existing issues that may exist
6. Once a PR is merged, a new or existing `chore(release): version apps` PR will be created, or updated
   - This will also update the `CHANGELOG.md` for each app
7. Merge the `chore(release): version apps` when you're ready
