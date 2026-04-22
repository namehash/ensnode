"use client";

import { useMemo } from "react";

import { useValidatedSelectedConnection } from "@/hooks/active/use-selected-connection";

export function useOpenApiUrl(): string {
  const selectedConnection = useValidatedSelectedConnection();
  return useMemo(
    () => new URL("/openapi.json", selectedConnection).toString(),
    [selectedConnection],
  );
}
