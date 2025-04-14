"use client";

import { ENSNodeErrorMessage } from "@/components/ensnode/components";
import { ErrorMessage } from "@/components/ui/error-message";
import { useEffect } from "react";

interface ErrorProps {
  error: Error;
  reset: () => void;
}

/**
 * Renders an error message for unknown errors at the root of the app.
 * Note: It catches all unhandled errors from nested app routes.
 *
 * @param error The error to render.
 * @returns The error message.
 */
export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  if (ENSNodeErrorMessage.isHandledError(error)) {
    return <ENSNodeErrorMessage error={error} reset={reset} />;
  }

  return (
    <ErrorMessage>
      <ErrorMessage.Header>Unknown error</ErrorMessage.Header>
      <ErrorMessage.Message>An unknown error occurred.</ErrorMessage.Message>
    </ErrorMessage>
  );
}
