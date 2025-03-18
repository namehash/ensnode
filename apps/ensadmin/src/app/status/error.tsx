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

    const handleResetError = () => reset();

    // Add event listener
    window.addEventListener("ensnode/connection/set", handleResetError);

    // Clean up event listener on unmount
    return () => {
      window.removeEventListener("ensnode/connection/set", handleResetError);
    };
  }, [error]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">An error occurred</h1>
      <p className="text-gray-600">{error.message}</p>
    </div>
  );
}
