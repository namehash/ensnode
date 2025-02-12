import { Navigate, Outlet, Route, Routes, useSearchParams } from "react-router-dom";
import { About } from "./components/About";
import { GraphiQLWrapper } from "./components/GraphiQLWrapper";
import { Layout } from "./components/Layout";
import { PonderClient } from "./components/PonderClient";
import { getEnsNodeUrl } from "./utils/url";

function AppRoutes() {
  const [searchParams] = useSearchParams();
  const ensnodeUrl = getEnsNodeUrl(searchParams);

  return (
    <Layout ensnodeUrl={ensnodeUrl}>
      <Outlet context={{ ensnodeUrl }} />
    </Layout>
  );
}

function RedirectToDefault() {
  const [searchParams] = useSearchParams();
  const ensnodeUrl = getEnsNodeUrl(searchParams);
  const to = ensnodeUrl ? `/about?ensnode=${ensnodeUrl}` : "/about";

  return <Navigate to={to} replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<RedirectToDefault />} />
      <Route element={<AppRoutes />}>
        <Route path="/about" element={<About />} />
        <Route path="/gql">
          <Route path="ponder" element={<GraphiQLWrapper endpoint="ponder" />} />
          <Route path="subgraph-compat" element={<GraphiQLWrapper endpoint="subgraph" />} />
        </Route>
        <Route path="/ponder-client" element={<PonderClient />} />
      </Route>
    </Routes>
  );
}

export default App;
