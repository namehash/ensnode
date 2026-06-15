import { StrictMode } from "react";
import { HashRouter, Link, Outlet, Route, Routes, useParams } from "react-router";

import { AccountView } from "./AccountView";
import { accountPath, domainNamePath, useAppPath } from "./app-paths";
import { DomainByIdView, DomainByNameView } from "./DomainView";
import { EnsnodeInstanceProvider, InstanceSelector, useEnsnodeInstance } from "./EnsnodeInstanceProvider";
import { NamegraphRootRedirect, NamegraphView } from "./NamegraphView";
import { RegistryView } from "./RegistryView";
import { SearchView } from "./SearchView";

function Layout() {
  const { constants } = useEnsnodeInstance();
  const appPath = useAppPath();

  return (
    <>
      <p>
        <InstanceSelector />
      </p>
      <nav>
        <Link to={appPath("/")}>Home</Link> |{" "}
        <Link to={appPath(domainNamePath(constants.defaultDomainName))}>Domain Browser</Link> |{" "}
        <Link to={appPath(accountPath(constants.defaultAddress))}>Account Browser</Link> |{" "}
        <Link to={appPath("/registry")}>Registry Cache Demo</Link> |{" "}
        <Link to={appPath("/search")}>Search Demo</Link> |{" "}
        <Link to={appPath("/namegraph")}>Namegraph Explorer</Link>
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
          Use the ENSNode instance selector in the header to switch between hosted instances.
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
