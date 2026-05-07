"use client";

import type { EnsNodeClient } from "enssdk/core";
import { createElement, type ReactElement, type ReactNode, useMemo } from "react";
import { Provider } from "urql";

import { createOmnigraphUrqlClient } from "./client";

export interface OmnigraphProviderProps {
  client: EnsNodeClient;
  children?: ReactNode;
}

export function OmnigraphProvider({ client, children }: OmnigraphProviderProps): ReactElement {
  const urqlClient = useMemo(() => createOmnigraphUrqlClient(client.config), [client]);

  return createElement(Provider, { value: urqlClient }, children);
}
