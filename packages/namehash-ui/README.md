# @namehash/namehash-ui

The contained UI components are for reuse across multiple apps developed by the NameHash Labs team, but are highly opinionated according to our specific apps and therefore aren't intended for the general public.

For UI component libraries intended for the general public, we recommend [ensnode-react](https://www.npmjs.com/package/@ensnode/ensnode-react).

## Installation

```bash
npm install @namehash/namehash-ui @ensnode/ensnode-react
```

Note: `@ensnode/ensnode-react` is necessary only for some components. It might happen that you won't need it. 

## Setup

The `namehash-ui` package comes with its own styles exported for some components, as well as global Tailwind styles (soon to be removed).

Make sure you import the `styles.css` file somewhere in your app:

```tsx
import "@namehash/namehash-ui/styles.css";
```