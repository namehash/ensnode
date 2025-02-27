import { Navigate, Outlet, Route, Routes, useSearchParams } from "react-router-dom";

import { About } from "./components/About";
import { GraphiQLWrapper } from "./components/GraphiQLWrapper";
import { Layout } from "./components/Layout";
import { PonderClient } from "./components/PonderClient";
import { ensNodeUrl } from "./utils/url";

function AppRoutes() {
  const [searchParams] = useSearchParams();
  const url = ensNodeUrl(searchParams);

  return (
    <Layout ensNodeUrl={url}>
      <Outlet context={{ ensNodeUrl: url }} />
    </Layout>
  );
}

function RedirectToDefault() {
  const [searchParams] = useSearchParams();
  const url = ensNodeUrl(searchParams);
  const to = url ? `/about?ensnode=${url}` : "/about";

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
