import { StrictMode } from "react";

import { createEnsNodeProviderOptions, EnsNodeProvider } from "@ensnode/ensnode-react";

import { PrimaryNameView } from "./PrimaryNameView";

const ENSNODE_URL = import.meta.env.VITE_ENSNODE_URL ?? "https://api.alpha.ensnode.io";

const options = createEnsNodeProviderOptions({ url: ENSNODE_URL });

export function App() {
  return (
    <StrictMode>
      <EnsNodeProvider options={options}>
        <h1>
          <code>ensnode-react</code> Example App
        </h1>
        <p>
          Connected to <code>{ENSNODE_URL}</code>
        </p>
        <PrimaryNameView />
      </EnsNodeProvider>
    </StrictMode>
  );
}
