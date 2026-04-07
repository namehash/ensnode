import { createRoot } from "react-dom/client";

import { App } from "./App";

// mount the <App /> in the #root div
// biome-ignore lint/style/noNonNullAssertion: the #root element definitely exists (see index.html)
createRoot(document.getElementById("root")!).render(<App />);
