"use client";

import { PageShell } from "@/components/page-shell";
import { useEffect } from "react";

export default function Error({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // log the error to the console for operators
    console.error(error);
  }, [error]);

  return (
    <PageShell>
      <div className="p-6">
        <h1 className="text-2xl font-bold">An error occurred</h1>
        <p className="text-gray-600">{error.message}</p>
      </div>
    </PageShell>
  );
}
