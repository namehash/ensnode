"use client";

import { ApiReferenceReact, type ReferenceProps } from "@scalar/api-reference-react";
import { useEffect, useMemo, useState } from "react";
import "@scalar/api-reference-react/style.css";

interface ScalarApiReferenceProps {
  /** URL to the OpenAPI spec (e.g. `https://api.alpha.ensnode.io/openapi.json`) */
  url: string;
  /**
   * Overrides the `servers` list in the OpenAPI spec so the playground targets
   * this base URL instead (e.g. the currently active connection).
   */
  serverUrl?: string;
}

const CUSTOM_CSS = `
  .scalar-api-reference { --scalar-y-offset: 0; }
  .references-layout {
    height: calc(100svh - var(--ensadmin-header-height, 4rem)) !important;
    min-height: 0 !important;
    max-height: calc(100svh - var(--ensadmin-header-height, 4rem)) !important;
    --full-height: calc(100svh - var(--ensadmin-header-height, 4rem)) !important;
    grid-template-rows: var(--scalar-header-height, 0px) 1fr auto !important;
  }
  .references-rendered {
    overflow-y: auto !important;
    min-height: 0 !important;
  }
  .references-navigation-list {
    height: 100% !important;
  }
  .scalar-app, .scalar-api-reference {
    --scalar-font: var(--font-inter), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
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
  .section-container:not(.section-container .section-container) {
    padding-inline: clamp(16px, 4vw, 60px) !important;
  }
`;

export function ScalarApiReference({ url, serverUrl }: ScalarApiReferenceProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const configuration = useMemo<NonNullable<ReferenceProps["configuration"]>>(
    () => ({
      url,
      servers: serverUrl ? [{ url: serverUrl }] : undefined,
      theme: "none",
      hideDownloadButton: true,
      hiddenClients: true,
      defaultOpenAllTags: true,
      forceDarkModeState: "light",
      hideDarkModeToggle: true,
      withDefaultFonts: false,
      hideClientButton: true,
      customCss: CUSTOM_CSS,
    }),
    [url, serverUrl],
  );

  if (!mounted) return null;

  return <ApiReferenceReact configuration={configuration} />;
}
