import { OmnigraphProvider } from "enskit/react/omnigraph";
import { createEnsNodeClient } from "enssdk/core";
import { omnigraph } from "enssdk/omnigraph";
import { StrictMode } from "react";
import { BrowserRouter, Link, Route, Routes } from "react-router";

import { DomainView } from "./DomainView";
import { PaginationView } from "./PaginationView";
import { RegistryView } from "./RegistryView";

/**
 * Gets the ENSNODE_URL from the environment, defaulting to a local ENSNode at http://localhost:4334.
 *
 * To override, provide ENSNODE_URL in your environment like:
 * ENSNODE_URL=https://api.alpha.ensnode.io pnpm dev
 */
const ENSNODE_URL = import.meta.env.VITE_ENSNODE_URL ?? "http://localhost:4334";

console.log(`Connecting to ENSNode at ${ENSNODE_URL}`);

/**
 * Constructs an EnsNodeClient and extends it with the Omnigraph module, for use with `enskit`.
 */
const client = createEnsNodeClient({ url: ENSNODE_URL }).extend(omnigraph);

export function App() {
  return (
    <StrictMode>
      <OmnigraphProvider client={client}>
        <h1>
          <code>enskit</code> Example App
        </h1>
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                <nav>
                  <Link to="/domain/eth">Domain Browser</Link> |{" "}
                  <Link to="/registry">Registry Cache Demo</Link> |{" "}
                  <Link to="/pagination">Pagination Demo</Link>
                </nav>
              }
            />
            <Route path="/domain/*" element={<DomainView />} />
            <Route path="/pagination" element={<PaginationView />} />
            <Route path="/registry" element={<RegistryView />} />
          </Routes>
        </BrowserRouter>
      </OmnigraphProvider>
    </StrictMode>
  );
}
