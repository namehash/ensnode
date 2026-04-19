"use client";

import { type ReferenceProps, ApiReferenceReact } from "@scalar/api-reference-react";
import "@scalar/api-reference-react/style.css";

interface ScalarApiReferenceProps {
  /** URL to the OpenAPI spec (e.g. `https://api.alpha.ensnode.io/openapi.json`) */
  url: string;
}

const CUSTOM_CSS = `
  .light-mode {
    --scalar-color-1: #121212;
    --scalar-color-2: rgba(0, 0, 0, 0.6);
    --scalar-color-3: rgba(0, 0, 0, 0.4);
    --scalar-color-accent: hsl(222.2, 47.4%, 11.2%);
    --scalar-background-1: #ffffff;
    --scalar-background-2: #f6f5f4;
    --scalar-background-3: #f1ede9;
    --scalar-background-accent: color-mix(in srgb, hsl(222.2, 47.4%, 11.2%) 6%, transparent);
    --scalar-border-color: hsl(214.3, 31.8%, 91.4%);
  }
  .scalar-mcp-layer { display: none !important; }
  .section { padding-inline: 0 !important; }
`;

export function ScalarApiReference({ url }: ScalarApiReferenceProps) {
  if (typeof window === "undefined") return null;

  const configuration: NonNullable<ReferenceProps["configuration"]> = {
    url,
    theme: "none",
    hideDownloadButton: true,
    hiddenClients: true,
    defaultOpenAllTags: true,
    forceDarkModeState: "light",
    hideDarkModeToggle: true,
    withDefaultFonts: false,
    hideClientButton: true,
    customCss: CUSTOM_CSS,
  };

  return (
    <div className="flex-1">
      <ApiReferenceReact configuration={configuration} />
    </div>
  );
}
