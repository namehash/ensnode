import { OmnigraphProvider } from "enskit/react/omnigraph";
import { createEnsNodeClient } from "enssdk/core";
import { omnigraph } from "enssdk/omnigraph";
import { StrictMode } from "react";
import { HashRouter, Link, Outlet, Route, Routes } from "react-router";

import { DomainView } from "./DomainView";
import { RegistryView } from "./RegistryView";
import { SearchView } from "./SearchView";

/**
 * Gets the ENSNODE_URL from the environment, defaulting to the NameHash-hosted Sepolia-V2 Namespace
 * at https://api.v2-sepolia.ensnode.io
 *
 * To override, provide ENSNODE_URL in your environment like:
 * ENSNODE_URL=https://api.alpha.ensnode.io pnpm dev
 */
const ENSNODE_URL = import.meta.env.VITE_ENSNODE_URL ?? "https://api.v2-sepolia.ensnode.io";

console.log(`Connecting to ENSNode at ${ENSNODE_URL}`);

/**
 * Constructs an EnsNodeClient and extends it with the Omnigraph module, for use with `enskit`.
 */
const client = createEnsNodeClient({ url: ENSNODE_URL }).extend(omnigraph);

function Layout() {
  return (
    <>
      <nav>
        <Link to="/">Home</Link> | <Link to="/domain/eth">Domain Browser</Link> |{" "}
        <Link to="/registry">Registry Cache Demo</Link> | <Link to="/search">Search Demo</Link>
      </nav>
      <hr />
      <Outlet />
    </>
  );
}

function Home() {
  return <p>Welcome — pick a demo above.</p>;
}

export function App() {
  return (
    <StrictMode>
      <OmnigraphProvider client={client}>
        <h1>
          <code>enskit</code> Example App
        </h1>
        <HashRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/domain/:name" element={<DomainView />} />
              <Route path="/search" element={<SearchView />} />
              <Route path="/registry" element={<RegistryView />} />
            </Route>
          </Routes>
        </HashRouter>
      </OmnigraphProvider>
    </StrictMode>
  );
}
