# @namehash/namehash-ui

The contained UI components are for reuse across multiple apps developed by the NameHash Labs team, but are highly opinionated according to our specific apps and therefore aren't intended for the general public.

For UI component libraries intended for the general public, we recommend [ensnode-react](https://www.npmjs.com/package/@ensnode/ensnode-react).

## Installation

```bash
npm install @namehash/namehash-ui @ensnode/ensnode-react sonner
```

Note: `@ensnode/ensnode-react` and `sonner` are package's peer dependencies. The former is necessary only for some components and same goes for `sonner` which is only necessary for `CopyButton` component. It might happen that you won't need these installed, depending on which components you want to use.

## Setup

The `namehash-ui` package comes with its own styles exported for some components, as well as global Tailwind styles.

Make sure you import the `styles.css` file somewhere in your app:

```tsx
import "@namehash/namehash-ui/styles.css";
```