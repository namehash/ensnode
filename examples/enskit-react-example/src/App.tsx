import { OmnigraphProvider } from "enskit/react/omnigraph";
import { StrictMode } from "react";
import { HashRouter, Link, Outlet, Route, Routes, useParams } from "react-router";

import { AccountView } from "./AccountView";
import { DomainByIdView, DomainByNameView } from "./DomainView";
import { client, ENSNODE_URL } from "./ensnode";
import { NamegraphRootRedirect, NamegraphView } from "./NamegraphView";
import { RegistryView } from "./RegistryView";
import { SearchView } from "./SearchView";

const EXAMPLE_ACCOUNT_ADDRESS = "0x801d2e48d378f161dba7ad7ad002ad557714c191";

console.log(`Connecting to ENSNode at ${ENSNODE_URL}`);

function Layout() {
  return (
    <>
      <nav>
        <Link to="/">Home</Link> | <Link to="/domain/name/eth">Domain Browser</Link> |{" "}
        <Link to={`/account/${EXAMPLE_ACCOUNT_ADDRESS}`}>Account Browser</Link> |{" "}
        <Link to="/registry">Registry Cache Demo</Link> | <Link to="/search">Search Demo</Link> |{" "}
        <Link to="/namegraph">Namegraph Explorer</Link>
      </nav>
      <hr />
      <Outlet />
    </>
  );
}

/**
 * Reads `:registryId` and renders the explorer keyed by it, so navigating
 * between registries fully re-initializes the underlying file-tree model.
 */
function NamegraphRoute() {
  const { registryId } = useParams<{ registryId: string }>();
  if (!registryId) return <NamegraphRootRedirect />;
  return <NamegraphView key={registryId} registryId={registryId} />;
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
              <Route path="/namegraph" element={<NamegraphRootRedirect />} />
              {/* keyed by registryId so the tree re-initializes for each registry */}
              <Route path="/namegraph/:registryId" element={<NamegraphRoute />} />
            </Route>
          </Routes>
        </HashRouter>
      </OmnigraphProvider>
    </StrictMode>
  );
}
