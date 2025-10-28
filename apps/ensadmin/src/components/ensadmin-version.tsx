"use client";

import { Suspense, use } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { ensAdminVersion } from "@/lib/env";

const versionPromise = ensAdminVersion();

function ENSAdminVersionInner() {
  const version = use(versionPromise);
  return (
    <span className="text-sm leading-normal font-normal text-muted-foreground">v{version}</span>
  );
}

function ENSAdminVersionSkeleton() {
  return <Skeleton className="h-5 w-12" />;
}

export function ENSAdminVersion() {
  return (
    <Suspense fallback={<ENSAdminVersionSkeleton />}>
      <ENSAdminVersionInner />
    </Suspense>
  );
}
