import { OmnigraphProvider } from "enskit/react/omnigraph";
import { createEnsNodeClient } from "enssdk/core";
import { omnigraph } from "enssdk/omnigraph";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Link, Route, Routes } from "react-router";

import { DomainView } from "./DomainView";
import { PaginationView } from "./PaginationView";
import { RegistryView } from "./RegistryView";

const ENSNODE_URL = "http://localhost:4334";
const client = createEnsNodeClient({ url: ENSNODE_URL }).extend(omnigraph);

// biome-ignore lint/style/noNonNullAssertion: exists
createRoot(document.getElementById("root")!).render(
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
                <Link to="/domain/eth">Domains</Link> |{" "}
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
  </StrictMode>,
);
