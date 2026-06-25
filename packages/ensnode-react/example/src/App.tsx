import { StrictMode } from "react";

import { createEnsNodeProviderOptions, EnsNodeProvider } from "@ensnode/ensnode-react";

import { IndexingStatusBadge } from "./components/IndexingStatusBadge";
import { RequireActiveConnection } from "./components/RequireActiveConnection";
import { ENSNODE_URL, EXPECTED_NAMESPACE } from "./config";
import { PrimaryNameView } from "./PrimaryNameView";

const options = createEnsNodeProviderOptions({ url: ENSNODE_URL });

export function App() {
  return (
    <StrictMode>
      <EnsNodeProvider options={options}>
        <main>
          <header>
            <h1>
              <code>ensnode-react</code> Example App
            </h1>
            <p>
              Configured ENSNode: <code>{ENSNODE_URL.href}</code>
              <br />
              Expected ENS namespace: <code>{EXPECTED_NAMESPACE}</code>
            </p>
            <IndexingStatusBadge />
          </header>

          <RequireActiveConnection>
            <PrimaryNameView />
          </RequireActiveConnection>
        </main>
      </EnsNodeProvider>
    </StrictMode>
  );
}
