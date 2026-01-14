# ENSNode Documentation

[docs.ensnode.io](https://docs.ensnode.io) runs on [Mintlify](https://mintlify.com).

## Local Development

### Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/namehash/ensnode.git
   ```

2. Navigate to the docs directory:

   ```bash
   cd ensnode/docs/docs.ensnode.io
   ```

3. Install dependencies:

   ```bash
   pnpm install
   ```

4. Start the local development server:

   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Troubleshooting

- If your dev environment isn't running, run `mintlify install` to ensure dependencies are installed correctly.
- If a page loads as a 404, make sure you are running in a folder with a valid `docs.json`.

## Publishing Changes

Changes pushed to the main branch are automatically deployed to production.

## Resources

- [Mintlify documentation](https://mintlify.com/docs)
