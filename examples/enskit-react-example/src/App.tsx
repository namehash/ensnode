import { OmnigraphProvider } from "enskit/react/omnigraph";
import { createEnsNodeClient } from "enssdk/core";
import { omnigraph } from "enssdk/omnigraph";
import { StrictMode } from "react";
import { HashRouter, Link, Outlet, Route, Routes } from "react-router";

import { AccountView } from "./AccountView";
import { DomainByIdView, DomainByNameView } from "./DomainView";
import { RegistryView } from "./RegistryView";
import { SearchView } from "./SearchView";

const EXAMPLE_ACCOUNT_ADDRESS = "0x2f8e8b1126e75fde0b7f731e7cb5847eba2d2574";

// you may use a NameHash Hosted ENSNode instance
// learn more at https://ensnode.io/docs/hosted-instances
//
// NOTE: we point at the `blue` deployment, which runs ENSNode 1.14.x — the version this example's
// queries target. The production v2-sepolia instance still serves an older Omnigraph schema (1.13.x).
const ENSNODE_URL = import.meta.env.VITE_ENSNODE_URL ?? "https://api.v2-sepolia.blue.ensnode.io";

console.log(`Connecting to ENSNode at ${ENSNODE_URL}`);

/**
 * Constructs an EnsNodeClient and extends it with the Omnigraph module, for use with `enskit`.
 */
const client = createEnsNodeClient({ url: ENSNODE_URL }).extend(omnigraph);

function Layout() {
  return (
    <>
      <nav>
        <Link to="/">Home</Link> | <Link to="/domain/name/eth">Domain Browser</Link> |{" "}
        <Link to={`/account/${EXAMPLE_ACCOUNT_ADDRESS}`}>Account Browser</Link> |{" "}
        <Link to="/registry">Registry Cache Demo</Link> | <Link to="/search">Search Demo</Link>
      </nav>
      <hr />
      <Outlet />
    </>
  );
}

function Home() {
  return (
    <div>
      <p>Welcome — pick a demo above.</p>
      <p>Connected to ENSNode at {ENSNODE_URL}</p>
    </div>
  );
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
              <Route path="/domain/name/:name" element={<DomainByNameView />} />
              <Route path="/domain/id/:id" element={<DomainByIdView />} />
              <Route path="/account/:address" element={<AccountView />} />
              <Route path="/search" element={<SearchView />} />
              <Route path="/registry" element={<RegistryView />} />
            </Route>
          </Routes>
        </HashRouter>
      </OmnigraphProvider>
    </StrictMode>
  );
}
