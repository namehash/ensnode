"use client";

import type { EnsNodeClient } from "enssdk/core";
import { createElement, useMemo } from "react";
import { Provider } from "urql";

import { createOmnigraphUrqlClient } from "./client";

export interface OmnigraphProviderProps {
  client: EnsNodeClient;
  children?: React.ReactNode;
}

export function OmnigraphProvider({ client, children }: OmnigraphProviderProps) {
  const urqlClient = useMemo(
    () => createOmnigraphUrqlClient(client.config.url),
    [client.config.url],
  );

  return createElement(Provider, { value: urqlClient }, children);
}
