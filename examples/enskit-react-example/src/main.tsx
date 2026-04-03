import { OmnigraphProvider } from "enskit/react/omnigraph";
import { createEnsNodeClient } from "enssdk/core";
import { omnigraph } from "enssdk/omnigraph";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";

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
                <a href="/domain/eth">Domains</a> | <a href="/registry">Registry Cache Demo</a> |{" "}
                <a href="/pagination">Pagination Demo</a>
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
