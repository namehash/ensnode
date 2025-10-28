"use client";

import { useEffect, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { ensAdminVersion } from "@/lib/env";

export function ENSAdminVersion() {
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    ensAdminVersion().then(setVersion);
  }, []);

  if (version === null) {
    return <Skeleton className="h-5 w-12" />;
  }

  return (
    <span className="text-sm leading-normal font-normal text-muted-foreground">v{version}</span>
  );
}
