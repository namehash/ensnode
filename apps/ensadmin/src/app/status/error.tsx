"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    // log the error to the console for operators
    console.error(error);
  }, [error]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">An error occurred</h1>
      <p className="text-gray-600">{error.message}</p>
    </div>
  );
}
