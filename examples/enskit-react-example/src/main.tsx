import { OmnigraphProvider } from "enskit/react/omnigraph";
import { createEnsNodeClient } from "enssdk/core";
import { omnigraph } from "enssdk/omnigraph";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";

import { DomainView } from "./DomainView";

const ENSNODE_URL = "http://localhost:4334";
const client = createEnsNodeClient({ url: ENSNODE_URL }).extend(omnigraph);

// biome-ignore lint/style/noNonNullAssertion: exists
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <OmnigraphProvider client={client}>
      <h1>
        <code>enskit</code> Namegraph Explorer
      </h1>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/domain/eth" replace />} />
          <Route path="/domain/*" element={<DomainView />} />
        </Routes>
      </BrowserRouter>
    </OmnigraphProvider>
  </StrictMode>,
);
