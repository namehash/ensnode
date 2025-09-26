"use client";

import { useAvailableENSNodeConnections } from "@/hooks/ensnode-connections";
import { CONNECTION_PARAM_KEY } from "@/lib/constants";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { PropsWithChildren, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

/**
 * Allows consumers to use `useActiveENSNodeConnection` by blocking rendering until it is available.
 * Also handles URL parameter synchronization and automatic connection from URL params.
 */
export function RequireActiveENSNodeConnection({ children }: PropsWithChildren<{}>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { availableConnections, selectedConnection, addCustomConnection } =
    useAvailableENSNodeConnections();

  const addConnectionFromUrl = useMutation({
    mutationFn: addCustomConnection,
  });

  const [existingConnectionUrl, setExistingConnectionUrl] = useState<string | null>(null);
  const [failedConnectionUrls, setFailedConnections] = useState<Set<string>>(new Set());

  const updateCurrentConnectionParam = useCallback(
    (url: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(CONNECTION_PARAM_KEY, url);
      router.replace(`?${params.toString()}`);
    },
    [router, searchParams],
  );

  // Show connection success toast
  useEffect(() => {
    const currentConnection = searchParams.get(CONNECTION_PARAM_KEY);

    if (
      existingConnectionUrl !== null &&
      existingConnectionUrl !== currentConnection &&
      currentConnection
    ) {
      toast.success(`Connected to ${currentConnection}`);
    }

    setExistingConnectionUrl(currentConnection);
  }, [searchParams, existingConnectionUrl]);

  // Handle URL parameter synchronization and connection loading
  useEffect(() => {
    const connectionParam = searchParams.get(CONNECTION_PARAM_KEY);

    // If no connection parameter exists and we have a selected connection, update URL
    if (!connectionParam && selectedConnection) {
      updateCurrentConnectionParam(selectedConnection.toString());
      return;
    }

    if (!connectionParam) return;

    if (failedConnectionUrls.has(connectionParam)) return;

    // Check if connection URL already exists in available connections (both default and custom)
    const existingConnection = availableConnections.find((conn) => conn.url === connectionParam);
    if (existingConnection) {
      return;
    }

    // Try to add connection from URL parameter
    addConnectionFromUrl.mutate(connectionParam, {
      onSuccess: (addedUrl) => {
        updateCurrentConnectionParam(addedUrl);
        toast.success(`URL saved to custom connections`);
        toast.success(`Connected to ${addedUrl}`);
      },
      onError: (error) => {
        toast.error(`Failed to connect: ${error.message}`);

        // Track this as a failed connection to prevent retry loop
        setFailedConnections((prev) => new Set(prev).add(connectionParam));

        // Remove invalid connection param from URL
        const params = new URLSearchParams(searchParams.toString());
        params.delete(CONNECTION_PARAM_KEY);
        router.replace(params.toString() ? `?${params.toString()}` : window.location.pathname);
      },
    });
  }, [
    searchParams,
    availableConnections,
    selectedConnection,
    addConnectionFromUrl,
    router,
    updateCurrentConnectionParam,
    failedConnectionUrls,
  ]);

  if (!selectedConnection) return null;

  return children;
}
