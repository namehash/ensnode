"use client";

import { Button } from "@/components/ui/button";
import { useENSNodeConnections } from "@/hooks/ensnode-connections";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { redirect, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const ENSNODE_PUBLIC_URL_QUERY_PARAM = "ensnode";

export default function ConnectPage() {
  const searchParams = useSearchParams();

  const { addAndSelectConnection: _addAndSelectConnection } = useENSNodeConnections();
  const addAndSelectConnection = useMutation({ mutationFn: _addAndSelectConnection });

  const ensNodeUrl = searchParams.get(ENSNODE_PUBLIC_URL_QUERY_PARAM);
  useEffect(() => {
    // no url param provided? just go back to status
    if (!ensNodeUrl) redirect("/status");

    addAndSelectConnection.mutate(ensNodeUrl, {
      onSuccess: () => redirect("/status"),
    });
  }, []);

  if (addAndSelectConnection.isPending) {
    // TODO: make this loading state prettier once ensnode addition is perceptibly async
    return null;
  }

  if (addAndSelectConnection.isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <h2 className="text-center">Something went wrong while connecting to ENSNode</h2>
        <p className="flex flex-row items-center justify-center gap-2">
          <span>Provided URL:</span>
          <span className="text-center font-mono bg-gray-200 py-1 px-2">{ensNodeUrl}</span>
        </p>
        <Link href="/">
          <Button>Go Home</Button>
        </Link>
      </div>
    );
  }

  return null;
}
