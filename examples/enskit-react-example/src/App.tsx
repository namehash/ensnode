import { StrictMode } from "react";
import { HashRouter, Link, Outlet, Route, Routes, useParams } from "react-router";

import { AccountView } from "./AccountView";
import { DomainByIdView, DomainByNameView } from "./DomainView";
import { EnsnodeInstanceProvider, InstanceSelector, useEnsnodeInstance } from "./EnsnodeInstanceProvider";
import { NamegraphRootRedirect, NamegraphView } from "./NamegraphView";
import { RegistryView } from "./RegistryView";
import { SearchView } from "./SearchView";

function Layout() {
  const { constants } = useEnsnodeInstance();

  return (
    <>
      <p>
        <InstanceSelector />
      </p>
      <nav>
        <Link to="/">Home</Link> |{" "}
        <Link to={`/domain/name/${constants.defaultDomainName}`}>Domain Browser</Link> |{" "}
        <Link to={`/account/${constants.defaultAddress}`}>Account Browser</Link> |{" "}
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
  const { ensnodeUrl } = useEnsnodeInstance();
  if (!registryId) return <NamegraphRootRedirect />;
  return <NamegraphView key={`${ensnodeUrl}:${registryId}`} registryId={registryId} />;
}

function Home() {
  const { ensnodeUrl, instanceSelectionDisabled } = useEnsnodeInstance();

  return (
    <div>
      <p>Welcome — pick a demo above.</p>
      <p>Connected to ENSNode at {ensnodeUrl}</p>
      {instanceSelectionDisabled ? (
        <p>
          Instance selection is disabled because <code>VITE_ENSNODE_URL</code> is set in the
          environment.
        </p>
      ) : (
        <p>
          Use the ENSNode instance selector in the header to switch between hosted instances (for
          example Alpha Mainnet for ENSv1-oriented data, or V2 Sepolia for ENSv2-oriented data). The
          choice is remembered in this browser. You can also deep-link with{" "}
          <code>?instance=&lt;id&gt;</code> (for example <code>?instance=v2-sepolia</code>).
          Per-instance demo constants live in <code>src/instances.ts</code>.
        </p>
      )}
    </div>
  );
}

export function App() {
  return (
    <StrictMode>
      <HashRouter>
        <EnsnodeInstanceProvider>
          <h1>
            <code>enskit</code> Example App
          </h1>
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
        </EnsnodeInstanceProvider>
      </HashRouter>
    </StrictMode>
  );
}
